import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ApplicationWording, ApplicationWordingVersion } from "@/types/database";

export interface ApplicationWordingWithDetail extends ApplicationWording {
  currentVersion: ApplicationWordingVersion | null;
  achievementIds: string[];
  jobApplication: { id: string; job_title: string; date_applied: string | null; companies: { id: string; name: string } | null } | null;
}

async function attachDetail(rows: ApplicationWording[]): Promise<ApplicationWordingWithDetail[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const versionIds = rows.map((r) => r.current_version_id).filter((v): v is string => !!v);
  const applicationIds = [...new Set(rows.map((r) => r.job_application_id))];

  const [versionsRes, linksRes, applicationsRes] = await Promise.all([
    versionIds.length
      ? supabase.from("application_wording_versions").select("*").in("id", versionIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("application_wording_achievements").select("application_wording_id, achievement_id").in("application_wording_id", ids),
    supabase.from("job_applications").select("id, job_title, date_applied, companies(id, name)").in("id", applicationIds),
  ]);
  if (versionsRes.error) throw versionsRes.error;
  if (linksRes.error) throw linksRes.error;
  if (applicationsRes.error) throw applicationsRes.error;

  const versionById = new Map((versionsRes.data as ApplicationWordingVersion[]).map((v) => [v.id, v]));
  const achievementsByWording = new Map<string, string[]>();
  for (const row of linksRes.data ?? []) {
    const arr = achievementsByWording.get(row.application_wording_id) ?? [];
    arr.push(row.achievement_id);
    achievementsByWording.set(row.application_wording_id, arr);
  }
  const applicationById = new Map((applicationsRes.data as unknown as ApplicationWordingWithDetail["jobApplication"][]).map((a) => [a!.id, a]));

  return rows.map((r) => ({
    ...r,
    currentVersion: r.current_version_id ? (versionById.get(r.current_version_id) ?? null) : null,
    achievementIds: achievementsByWording.get(r.id) ?? [],
    jobApplication: applicationById.get(r.job_application_id) ?? null,
  }));
}

export function useApplicationWordingsForApplication(jobApplicationId: string | undefined) {
  return useQuery({
    queryKey: ["applicationWordings", "byApplication", jobApplicationId],
    enabled: !!jobApplicationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_wordings")
        .select("*")
        .eq("job_application_id", jobApplicationId!)
        .eq("status", "active");
      if (error) throw error;
      return attachDetail(data as ApplicationWording[]);
    },
  });
}

export function useApplicationWordingsForAchievement(achievementId: string | undefined) {
  return useQuery({
    queryKey: ["applicationWordings", "byAchievement", achievementId],
    enabled: !!achievementId,
    queryFn: async () => {
      const { data: links, error: linkErr } = await supabase
        .from("application_wording_achievements")
        .select("application_wording_id")
        .eq("achievement_id", achievementId!);
      if (linkErr) throw linkErr;
      const wordingIds = [...new Set((links ?? []).map((l) => l.application_wording_id))];
      if (wordingIds.length === 0) return [];
      const { data, error } = await supabase.from("application_wordings").select("*").in("id", wordingIds).eq("status", "active");
      if (error) throw error;
      return attachDetail(data as ApplicationWording[]);
    },
  });
}

export function useApplicationWordingVersions(applicationWordingId: string | undefined) {
  return useQuery({
    queryKey: ["applicationWordingVersions", applicationWordingId],
    enabled: !!applicationWordingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_wording_versions")
        .select("*")
        .eq("application_wording_id", applicationWordingId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as ApplicationWordingVersion[];
    },
  });
}

export interface CreateApplicationWordingInput {
  jobApplicationId: string;
  text: string;
  achievementIds: string[];
  sourceMasterWordingId?: string | null;
  sourceMasterWordingVersionId?: string | null;
}

export function useCreateApplicationWording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationWordingInput) => {
      const { data: wording, error: wErr } = await supabase
        .from("application_wordings")
        .insert({
          job_application_id: input.jobApplicationId,
          source_master_wording_id: input.sourceMasterWordingId ?? null,
          source_master_wording_version_id: input.sourceMasterWordingVersionId ?? null,
        })
        .select()
        .single();
      if (wErr) throw wErr;

      const { data: version, error: vErr } = await supabase
        .from("application_wording_versions")
        .insert({ application_wording_id: wording.id, version_number: 1, text: input.text })
        .select()
        .single();
      if (vErr) throw vErr;

      const { error: updErr } = await supabase
        .from("application_wordings")
        .update({ current_version_id: version.id })
        .eq("id", wording.id);
      if (updErr) throw updErr;

      if (input.achievementIds.length > 0) {
        const { error: linkErr } = await supabase.from("application_wording_achievements").insert(
          input.achievementIds.map((achievement_id, i) => ({
            application_wording_id: wording.id,
            achievement_id,
            display_order: i,
          })),
        );
        if (linkErr) throw linkErr;
      }

      return wording as ApplicationWording;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicationWordings"] });
    },
  });
}

// Edits create a NEW immutable version — the prior version's text is preserved (spec §37).
export function useAddApplicationWordingVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationWordingId, text }: { applicationWordingId: string; text: string }) => {
      const { data: latest, error: latestErr } = await supabase
        .from("application_wording_versions")
        .select("version_number")
        .eq("application_wording_id", applicationWordingId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestErr) throw latestErr;
      const nextVersion = (latest?.version_number ?? 0) + 1;

      const { data: version, error: vErr } = await supabase
        .from("application_wording_versions")
        .insert({ application_wording_id: applicationWordingId, version_number: nextVersion, text })
        .select()
        .single();
      if (vErr) throw vErr;

      const { error: updErr } = await supabase
        .from("application_wordings")
        .update({ current_version_id: version.id })
        .eq("id", applicationWordingId);
      if (updErr) throw updErr;

      return version as ApplicationWordingVersion;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicationWordings"] });
      qc.invalidateQueries({ queryKey: ["applicationWordingVersions"] });
    },
  });
}

// Promotion: Application Wording -> Master Wording (spec §38). Never mutates
// the Application Wording. Caller must pick exactly one Achievement (enforced
// in the UI dialog when the wording links multiple Achievements) and always
// explicitly chooses Job Type(s) — never auto-inherited from the application.
export interface PromoteToMasterInput {
  achievementId: string;
  text: string;
  jobTypeIds: string[];
  targetMasterWordingId?: string | null; // if set, adds a new version to this existing Master Wording
  changeNote?: string;
}

export function usePromoteApplicationWording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PromoteToMasterInput) => {
      let masterWordingId = input.targetMasterWordingId ?? null;

      if (!masterWordingId) {
        const { data: wording, error: wErr } = await supabase
          .from("master_wordings")
          .insert({ achievement_id: input.achievementId })
          .select()
          .single();
        if (wErr) throw wErr;
        masterWordingId = wording.id;
      }

      const { data: latest, error: latestErr } = await supabase
        .from("master_wording_versions")
        .select("version_number")
        .eq("master_wording_id", masterWordingId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestErr) throw latestErr;
      const nextVersion = (latest?.version_number ?? 0) + 1;

      const { data: version, error: vErr } = await supabase
        .from("master_wording_versions")
        .insert({
          master_wording_id: masterWordingId,
          version_number: nextVersion,
          text: input.text,
          change_note: input.changeNote ?? "Promoted from Application Wording",
        })
        .select()
        .single();
      if (vErr) throw vErr;

      const { error: updErr } = await supabase
        .from("master_wordings")
        .update({ current_version_id: version.id })
        .eq("id", masterWordingId);
      if (updErr) throw updErr;

      if (input.jobTypeIds.length > 0) {
        const { error: delErr } = await supabase.from("master_wording_job_types").delete().eq("master_wording_id", masterWordingId);
        if (delErr) throw delErr;
        const { error: jtErr } = await supabase
          .from("master_wording_job_types")
          .insert(input.jobTypeIds.map((job_type_id) => ({ master_wording_id: masterWordingId, job_type_id })));
        if (jtErr) throw jtErr;
      }

      return { masterWordingId, versionId: version.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["masterWordings"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}
