import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MasterWording, MasterWordingVersion, Status } from "@/types/database";

export interface MasterWordingWithDetail extends MasterWording {
  currentVersion: MasterWordingVersion | null;
  jobTypeIds: string[];
}

async function attachDetail(wordings: MasterWording[]): Promise<MasterWordingWithDetail[]> {
  if (wordings.length === 0) return [];
  const ids = wordings.map((w) => w.id);
  const versionIds = wordings.map((w) => w.current_version_id).filter((v): v is string => !!v);

  const [versionsRes, jobTypesRes] = await Promise.all([
    versionIds.length
      ? supabase.from("master_wording_versions").select("*").in("id", versionIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("master_wording_job_types").select("master_wording_id, job_type_id").in("master_wording_id", ids),
  ]);
  if (versionsRes.error) throw versionsRes.error;
  if (jobTypesRes.error) throw jobTypesRes.error;

  const versionById = new Map((versionsRes.data as MasterWordingVersion[]).map((v) => [v.id, v]));
  const jobTypesByWording = new Map<string, string[]>();
  for (const row of jobTypesRes.data ?? []) {
    const arr = jobTypesByWording.get(row.master_wording_id) ?? [];
    arr.push(row.job_type_id);
    jobTypesByWording.set(row.master_wording_id, arr);
  }

  return wordings.map((w) => ({
    ...w,
    currentVersion: w.current_version_id ? (versionById.get(w.current_version_id) ?? null) : null,
    jobTypeIds: jobTypesByWording.get(w.id) ?? [],
  }));
}

export function useMasterWordingsForAchievement(achievementId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: ["masterWordings", "byAchievement", achievementId, includeArchived],
    enabled: !!achievementId,
    queryFn: async () => {
      let query = supabase.from("master_wordings").select("*").eq("achievement_id", achievementId!);
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return attachDetail(data as MasterWording[]);
    },
  });
}

export function useMasterWordingsForAchievements(achievementIds: string[]) {
  return useQuery({
    queryKey: ["masterWordings", "byAchievements", achievementIds],
    enabled: achievementIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_wordings")
        .select("*")
        .in("achievement_id", achievementIds)
        .eq("status", "active");
      if (error) throw error;
      return attachDetail(data as MasterWording[]);
    },
  });
}

export function useMasterWordingVersionById(versionId: string | undefined | null) {
  return useQuery({
    queryKey: ["masterWordingVersion", versionId],
    enabled: !!versionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("master_wording_versions").select("*").eq("id", versionId!).single();
      if (error) throw error;
      return data as MasterWordingVersion;
    },
  });
}

export function useMasterWordingVersions(masterWordingId: string | undefined) {
  return useQuery({
    queryKey: ["masterWordingVersions", masterWordingId],
    enabled: !!masterWordingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_wording_versions")
        .select("*")
        .eq("master_wording_id", masterWordingId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as MasterWordingVersion[];
    },
  });
}

// Creates a brand new Master Wording (version 1) for an Achievement.
export function useCreateMasterWording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      achievementId,
      text,
      jobTypeIds,
      changeNote,
    }: {
      achievementId: string;
      text: string;
      jobTypeIds: string[];
      changeNote?: string;
    }) => {
      const { data: wording, error: wErr } = await supabase
        .from("master_wordings")
        .insert({ achievement_id: achievementId })
        .select()
        .single();
      if (wErr) throw wErr;

      const { data: version, error: vErr } = await supabase
        .from("master_wording_versions")
        .insert({ master_wording_id: wording.id, version_number: 1, text, change_note: changeNote ?? null })
        .select()
        .single();
      if (vErr) throw vErr;

      const { error: updErr } = await supabase
        .from("master_wordings")
        .update({ current_version_id: version.id })
        .eq("id", wording.id);
      if (updErr) throw updErr;

      if (jobTypeIds.length > 0) {
        const { error: jtErr } = await supabase
          .from("master_wording_job_types")
          .insert(jobTypeIds.map((job_type_id) => ({ master_wording_id: wording.id, job_type_id })));
        if (jtErr) throw jtErr;
      }

      return wording as MasterWording;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["masterWordings"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

// Edits create a NEW immutable version and repoint current_version_id — the
// old version's row is never mutated (spec §19).
export function useAddMasterWordingVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      masterWordingId,
      text,
      changeNote,
    }: {
      masterWordingId: string;
      text: string;
      changeNote?: string;
    }) => {
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
        .insert({ master_wording_id: masterWordingId, version_number: nextVersion, text, change_note: changeNote ?? null })
        .select()
        .single();
      if (vErr) throw vErr;

      const { error: updErr } = await supabase
        .from("master_wordings")
        .update({ current_version_id: version.id })
        .eq("id", masterWordingId);
      if (updErr) throw updErr;

      return version as MasterWordingVersion;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["masterWordings"] });
      qc.invalidateQueries({ queryKey: ["masterWordingVersions"] });
    },
  });
}

export function useUpdateMasterWordingJobTypes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ masterWordingId, jobTypeIds }: { masterWordingId: string; jobTypeIds: string[] }) => {
      const { error: delErr } = await supabase.from("master_wording_job_types").delete().eq("master_wording_id", masterWordingId);
      if (delErr) throw delErr;
      if (jobTypeIds.length > 0) {
        const { error: insErr } = await supabase
          .from("master_wording_job_types")
          .insert(jobTypeIds.map((job_type_id) => ({ master_wording_id: masterWordingId, job_type_id })));
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["masterWordings"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useSetMasterWordingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { data, error } = await supabase.from("master_wordings").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data as MasterWording;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["masterWordings"] }),
  });
}
