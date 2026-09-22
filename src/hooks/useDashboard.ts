import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DashboardCounts {
  activeWorkspaces: number;
  activeAchievements: number;
  mandatoryAchievements: number;
  optionalAchievements: number;
  masterWordings: number;
}

export function useDashboardCounts() {
  return useQuery({
    queryKey: ["dashboard", "counts"],
    queryFn: async (): Promise<DashboardCounts> => {
      const [workspaces, achievements, mandatory, optional, masterWordings] = await Promise.all([
        supabase.from("cv_workspaces").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("achievements").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("achievements").select("id", { count: "exact", head: true }).eq("status", "active").eq("mandatory", true),
        supabase.from("achievements").select("id", { count: "exact", head: true }).eq("status", "active").eq("mandatory", false),
        supabase.from("master_wordings").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        activeWorkspaces: workspaces.count ?? 0,
        activeAchievements: achievements.count ?? 0,
        mandatoryAchievements: mandatory.count ?? 0,
        optionalAchievements: optional.count ?? 0,
        masterWordings: masterWordings.count ?? 0,
      };
    },
  });
}

export function useRecentApplications(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recentApplications", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id, job_title, date_applied, status, companies(id, name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        job_title: string;
        date_applied: string | null;
        status: string;
        companies: { id: string; name: string } | null;
      }>;
    },
  });
}

// Content gap (spec §16): Achievements relevant to a Job Type (direct or
// inherited) with no Master Wording tagged for THAT Job Type specifically.
export interface ContentGapRow {
  achievementId: string;
  subject: string;
}

export function useContentGaps(jobTypeId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "contentGaps", jobTypeId],
    enabled: !!jobTypeId,
    queryFn: async (): Promise<ContentGapRow[]> => {
      const [relevantRes, taggedWordingsRes] = await Promise.all([
        supabase.from("achievement_relevant_job_types").select("achievement_id").eq("job_type_id", jobTypeId!),
        supabase.from("master_wording_job_types").select("master_wording_id").eq("job_type_id", jobTypeId!),
      ]);
      if (relevantRes.error) throw relevantRes.error;
      if (taggedWordingsRes.error) throw taggedWordingsRes.error;

      const relevantAchievementIds = [...new Set((relevantRes.data ?? []).map((r) => r.achievement_id))];
      if (relevantAchievementIds.length === 0) return [];

      const taggedWordingIds = (taggedWordingsRes.data ?? []).map((r) => r.master_wording_id);
      let achievementsWithWordingForType = new Set<string>();
      if (taggedWordingIds.length > 0) {
        const { data: wordings, error: wErr } = await supabase
          .from("master_wordings")
          .select("achievement_id")
          .in("id", taggedWordingIds)
          .eq("status", "active");
        if (wErr) throw wErr;
        achievementsWithWordingForType = new Set((wordings ?? []).map((w) => w.achievement_id));
      }

      const gapIds = relevantAchievementIds.filter((id) => !achievementsWithWordingForType.has(id));
      if (gapIds.length === 0) return [];

      const { data: achievements, error: aErr } = await supabase
        .from("achievements")
        .select("id, subject")
        .in("id", gapIds)
        .eq("status", "active");
      if (aErr) throw aErr;
      return (achievements ?? []).map((a) => ({ achievementId: a.id, subject: a.subject }));
    },
  });
}
