import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { checkForCycles } from "@/lib/compoundCycles";
import type { Achievement } from "@/types/database";

export interface ComponentRef {
  id: string;
  subject: string;
  display_order: number;
}

// Components of this Achievement (this Achievement IS a Compound Achievement
// when this list is non-empty — spec §24).
export function useCompoundComponents(achievementId: string | undefined) {
  return useQuery({
    queryKey: ["compoundComponents", achievementId],
    enabled: !!achievementId,
    queryFn: async (): Promise<ComponentRef[]> => {
      const { data: links, error: linkErr } = await supabase
        .from("compound_achievement_components")
        .select("component_achievement_id, display_order")
        .eq("compound_achievement_id", achievementId!)
        .order("display_order");
      if (linkErr) throw linkErr;
      if (!links || links.length === 0) return [];
      const ids = links.map((l) => l.component_achievement_id);
      const { data: achievements, error: achErr } = await supabase.from("achievements").select("id, subject").in("id", ids);
      if (achErr) throw achErr;
      const byId = new Map((achievements as Pick<Achievement, "id" | "subject">[]).map((a) => [a.id, a.subject]));
      return links.map((l) => ({ id: l.component_achievement_id, subject: byId.get(l.component_achievement_id) ?? "?", display_order: l.display_order }));
    },
  });
}

// Compound Achievements that use this Achievement as one of their components.
export function useUsedAsComponentIn(achievementId: string | undefined) {
  return useQuery({
    queryKey: ["usedAsComponentIn", achievementId],
    enabled: !!achievementId,
    queryFn: async (): Promise<ComponentRef[]> => {
      const { data: links, error: linkErr } = await supabase
        .from("compound_achievement_components")
        .select("compound_achievement_id, display_order")
        .eq("component_achievement_id", achievementId!);
      if (linkErr) throw linkErr;
      if (!links || links.length === 0) return [];
      const ids = links.map((l) => l.compound_achievement_id);
      const { data: achievements, error: achErr } = await supabase.from("achievements").select("id, subject").in("id", ids);
      if (achErr) throw achErr;
      const byId = new Map((achievements as Pick<Achievement, "id" | "subject">[]).map((a) => [a.id, a.subject]));
      return links.map((l) => ({ id: l.compound_achievement_id, subject: byId.get(l.compound_achievement_id) ?? "?", display_order: l.display_order }));
    },
  });
}

// Which of the given Achievement ids are Compound Achievements (have >=1 component)?
export function useCompoundAchievementIds(achievementIds: string[]) {
  return useQuery({
    queryKey: ["compoundAchievementIds", [...achievementIds].sort()],
    enabled: achievementIds.length > 0,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("compound_achievement_components")
        .select("compound_achievement_id")
        .in("compound_achievement_id", achievementIds);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.compound_achievement_id));
    },
  });
}

// Replaces the full component set for a Compound Achievement, after
// validating no self-reference and no indirect cycle (spec §25). Never
// called automatically — always an explicit user action (spec §24).
export function useSetCompoundComponents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ compoundAchievementId, componentIds }: { compoundAchievementId: string; componentIds: string[] }) => {
      const check = await checkForCycles(compoundAchievementId, componentIds);
      if (!check.ok) throw new Error(check.reason);

      const { error: delErr } = await supabase.from("compound_achievement_components").delete().eq("compound_achievement_id", compoundAchievementId);
      if (delErr) throw delErr;
      if (componentIds.length > 0) {
        const { error: insErr } = await supabase.from("compound_achievement_components").insert(
          componentIds.map((component_achievement_id, i) => ({
            compound_achievement_id: compoundAchievementId,
            component_achievement_id,
            display_order: i,
          })),
        );
        if (insErr) throw insErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["compoundComponents", vars.compoundAchievementId] });
      qc.invalidateQueries({ queryKey: ["usedAsComponentIn"] });
    },
  });
}
