import { supabase } from "@/lib/supabase";

// Cycle prevention for Compound Achievements (spec §25). The full component
// graph is small (personal CV content, not a large dataset), so we fetch all
// edges and walk them in memory rather than writing a recursive SQL query.

async function fetchAllEdges(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase.from("compound_achievement_components").select("compound_achievement_id, component_achievement_id");
  if (error) throw error;
  const adjacency = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = adjacency.get(row.compound_achievement_id) ?? [];
    list.push(row.component_achievement_id);
    adjacency.set(row.compound_achievement_id, list);
  }
  return adjacency;
}

// Can `from` reach `to` by following existing compound -> component edges?
function canReach(adjacency: Map<string, string[]>, from: string, to: string, visited = new Set<string>()): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;
  visited.add(from);
  for (const next of adjacency.get(from) ?? []) {
    if (canReach(adjacency, next, to, visited)) return true;
  }
  return false;
}

export interface CycleCheckResult {
  ok: boolean;
  reason?: string;
}

// Would adding `compoundAchievementId -> each of componentIds` create a
// self-reference or an indirect cycle (A -> B -> C -> A)?
export async function checkForCycles(compoundAchievementId: string, componentIds: string[]): Promise<CycleCheckResult> {
  if (componentIds.includes(compoundAchievementId)) {
    return { ok: false, reason: "An Achievement cannot be a component of itself." };
  }
  const adjacency = await fetchAllEdges();
  for (const componentId of componentIds) {
    // If componentId can already reach compoundAchievementId, adding the new
    // edge compoundAchievementId -> componentId would close a cycle.
    if (canReach(adjacency, componentId, compoundAchievementId)) {
      return {
        ok: false,
        reason: "That would create a circular composition (this Achievement is already reachable, directly or indirectly, from the selected component).",
      };
    }
  }
  return { ok: true };
}
