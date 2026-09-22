import { supabase } from "@/lib/supabase";
import type { AchievementRelevantJobType } from "@/types/database";

// Thin wrapper around the `achievement_relevant_job_types` Postgres view —
// the ONLY place "direct ∪ inherited Job Types" is computed (spec §15).
// No business logic lives here; this just fetches and shapes the view's rows.

export async function fetchRelevantJobTypes(
  achievementIds?: string[],
): Promise<AchievementRelevantJobType[]> {
  let query = supabase.from("achievement_relevant_job_types").select("*");
  if (achievementIds && achievementIds.length > 0) {
    query = query.in("achievement_id", achievementIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface RelevantJobTypesByAchievement {
  direct: Set<string>;
  inherited: Set<string>;
}

export function groupRelevantJobTypes(
  rows: AchievementRelevantJobType[],
): Map<string, RelevantJobTypesByAchievement> {
  const map = new Map<string, RelevantJobTypesByAchievement>();
  for (const row of rows) {
    let entry = map.get(row.achievement_id);
    if (!entry) {
      entry = { direct: new Set(), inherited: new Set() };
      map.set(row.achievement_id, entry);
    }
    entry[row.source].add(row.job_type_id);
  }
  return map;
}
