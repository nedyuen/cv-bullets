import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Achievement, AchievementRating, Status } from "@/types/database";

export const ACHIEVEMENT_RATINGS: { value: AchievementRating; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export interface AchievementFilters {
  search?: string;
  // Each array is OR'd within itself (e.g. Job Type A OR Job Type B), then
  // AND'd against every other filter dimension via the id-set intersection
  // below. An empty/omitted array means "no filter" for that dimension.
  jobTypeIds?: string[];
  competencyIds?: string[];
  companyIds?: string[];
  careerRoleIds?: string[];
  projectIds?: string[];
  tagIds?: string[];
  ratings?: AchievementRating[]; // OR'd within itself, like the other multi-selects
  includeArchived?: boolean;
  // Tri-state: undefined = any, true = has, false = doesn't have (spec §41).
  hasMasterWording?: boolean;
  hasApplicationWording?: boolean;
  usedInWorkspace?: boolean;
}

// Sentinel filter value meaning "has none of this" (e.g. Project = none). Mixed
// with real values it is OR'd like any other value.
export const NONE = "__none__";

function intersect(sets: Array<Set<string> | null>): Set<string> | null {
  const active = sets.filter((s): s is Set<string> => s !== null);
  if (active.length === 0) return null;
  return active.reduce((acc, s) => new Set([...acc].filter((id) => s.has(id))));
}

async function idsForProjects(projectIds: string[]): Promise<Set<string>> {
  // Reads the achievement_relevant_projects view, not achievement_projects
  // directly — Compound Achievements' Projects are inherited from their
  // components, not manually assigned (see migration 0004).
  const { data, error } = await supabase.from("achievement_relevant_projects").select("achievement_id").in("project_id", projectIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsForCareerRoles(careerRoleIds: string[]): Promise<Set<string>> {
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .in("career_role_id", careerRoleIds);
  if (pErr) throw pErr;
  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("achievement_relevant_projects")
    .select("achievement_id")
    .in("project_id", projectIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsForCompanies(companyIds: string[]): Promise<Set<string>> {
  const { data: roles, error: rErr } = await supabase.from("career_roles").select("id").in("company_id", companyIds);
  if (rErr) throw rErr;
  const roleIds = (roles ?? []).map((r) => r.id);
  if (roleIds.length === 0) return new Set();
  const { data: projects, error: pErr } = await supabase.from("projects").select("id").in("career_role_id", roleIds);
  if (pErr) throw pErr;
  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("achievement_relevant_projects")
    .select("achievement_id")
    .in("project_id", projectIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsForCompetencies(competencyIds: string[]): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("achievement_competencies")
    .select("achievement_id")
    .in("competency_id", competencyIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsForTags(tagIds: string[]): Promise<Set<string>> {
  const { data, error } = await supabase.from("achievement_tags").select("achievement_id").in("tag_id", tagIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsForJobTypes(jobTypeIds: string[]): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("achievement_relevant_job_types")
    .select("achievement_id")
    .in("job_type_id", jobTypeIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

// Global search (spec §41): matches an Achievement's own fields, OR any of
// its Master/Application Wording text, Tags, Competencies, Project, Career
// Role or Company names. This is a union across sources, then combined with
// the other (AND) filters via the normal id-set intersection below.
async function idsForSearchTerm(term: string): Promise<Set<string>> {
  const like = `%${term}%`;
  const ids = new Set<string>();

  const [ownFields, tags, competencies, projects, careerRoles, companies, masterWordingVersions, applicationWordingVersions] =
    await Promise.all([
      supabase.from("achievements").select("id").or(`subject.ilike.${like},description.ilike.${like},significance_impact.ilike.${like},feedback.ilike.${like},draft.ilike.${like},notes.ilike.${like}`),
      supabase.from("tags").select("id").ilike("name", like),
      supabase.from("competencies").select("id").ilike("name", like),
      supabase.from("projects").select("id").ilike("name", like),
      supabase.from("career_roles").select("id").ilike("title", like),
      supabase.from("companies").select("id").ilike("name", like),
      supabase.from("master_wording_versions").select("master_wording_id").ilike("text", like),
      supabase.from("application_wording_versions").select("application_wording_id").ilike("text", like),
    ]);
  for (const r of ownFields.data ?? []) ids.add(r.id);

  const tagIds = (tags.data ?? []).map((t) => t.id);
  if (tagIds.length) {
    const { data } = await supabase.from("achievement_tags").select("achievement_id").in("tag_id", tagIds);
    for (const r of data ?? []) ids.add(r.achievement_id);
  }

  const competencyIds = (competencies.data ?? []).map((c) => c.id);
  if (competencyIds.length) {
    const { data } = await supabase.from("achievement_competencies").select("achievement_id").in("competency_id", competencyIds);
    for (const r of data ?? []) ids.add(r.achievement_id);
  }

  const directProjectIds = new Set((projects.data ?? []).map((p) => p.id));
  const careerRoleIds = (careerRoles.data ?? []).map((r) => r.id);
  const companyIds = (companies.data ?? []).map((c) => c.id);
  if (careerRoleIds.length) {
    const { data } = await supabase.from("projects").select("id").in("career_role_id", careerRoleIds);
    for (const p of data ?? []) directProjectIds.add(p.id);
  }
  if (companyIds.length) {
    const { data: roles } = await supabase.from("career_roles").select("id").in("company_id", companyIds);
    const roleIds = (roles ?? []).map((r) => r.id);
    if (roleIds.length) {
      const { data: projs } = await supabase.from("projects").select("id").in("career_role_id", roleIds);
      for (const p of projs ?? []) directProjectIds.add(p.id);
    }
  }
  if (directProjectIds.size) {
    const { data } = await supabase.from("achievement_relevant_projects").select("achievement_id").in("project_id", [...directProjectIds]);
    for (const r of data ?? []) ids.add(r.achievement_id);
  }

  const masterWordingIds = [...new Set((masterWordingVersions.data ?? []).map((v) => v.master_wording_id))];
  if (masterWordingIds.length) {
    const { data } = await supabase.from("master_wordings").select("achievement_id").in("id", masterWordingIds);
    for (const r of data ?? []) ids.add(r.achievement_id);
  }

  const applicationWordingIds = [...new Set((applicationWordingVersions.data ?? []).map((v) => v.application_wording_id))];
  if (applicationWordingIds.length) {
    const { data } = await supabase.from("application_wording_achievements").select("achievement_id").in("application_wording_id", applicationWordingIds);
    for (const r of data ?? []) ids.add(r.achievement_id);
  }

  return ids;
}

async function idsWithMasterWording(): Promise<Set<string>> {
  const { data, error } = await supabase.from("master_wordings").select("achievement_id").eq("status", "active");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsWithApplicationWording(): Promise<Set<string>> {
  const { data, error } = await supabase.from("application_wording_achievements").select("achievement_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function idsUsedInWorkspace(): Promise<Set<string>> {
  const { data, error } = await supabase.from("cv_workspace_achievements").select("achievement_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.achievement_id));
}

async function allAchievementIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("achievements").select("id").limit(10000);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.id));
}

async function idsWithAny(table: string, column = "achievement_id"): Promise<Set<string>> {
  const { data, error } = await supabase.from(table).select(column).limit(10000);
  if (error) throw error;
  return new Set(((data ?? []) as unknown as Record<string, string>[]).map((r) => r[column]));
}

// Resolves one filter dimension: the real values via `byValues`, plus (when the
// NONE sentinel is selected) every Achievement that has nothing in that dimension.
async function resolveDimension(
  values: string[] | undefined,
  byValues: (ids: string[]) => Promise<Set<string>>,
  withAnyTable: string,
): Promise<Set<string> | null> {
  if (!values?.length) return null;
  const real = values.filter((v) => v !== NONE);
  const result = real.length ? await byValues(real) : new Set<string>();
  if (values.includes(NONE)) {
    const [all, withAny] = await Promise.all([allAchievementIds(), idsWithAny(withAnyTable)]);
    for (const id of all) if (!withAny.has(id)) result.add(id);
  }
  return result;
}

export function useAchievements(filters: AchievementFilters = {}) {
  return useQuery({
    queryKey: ["achievements", filters],
    queryFn: async () => {
      const term = filters.search?.trim();
      const idSets = await Promise.all([
        resolveDimension(filters.projectIds, idsForProjects, "achievement_relevant_projects"),
        // Career Roles and Companies are reached through Projects, so "none" means no Project.
        resolveDimension(filters.careerRoleIds, idsForCareerRoles, "achievement_relevant_projects"),
        resolveDimension(filters.companyIds, idsForCompanies, "achievement_relevant_projects"),
        resolveDimension(filters.competencyIds, idsForCompetencies, "achievement_competencies"),
        resolveDimension(filters.tagIds, idsForTags, "achievement_tags"),
        resolveDimension(filters.jobTypeIds, idsForJobTypes, "achievement_relevant_job_types"),
        term ? idsForSearchTerm(term) : Promise.resolve(null),
      ]);
      const idFilter = intersect(idSets);
      if (idFilter !== null && idFilter.size === 0) return [] as Achievement[];

      let query = supabase.from("achievements").select("*").order("updated_at", { ascending: false });
      if (!filters.includeArchived) query = query.eq("status", "active");
      if (filters.ratings?.length) query = query.in("rating", filters.ratings);
      if (idFilter !== null) query = query.in("id", [...idFilter]);

      const { data, error } = await query;
      if (error) throw error;
      let results = data as Achievement[];

      // Tri-state usage filters are applied post-fetch (a "doesn't have"
      // condition doesn't fit the id-intersection model above).
      if (filters.hasMasterWording !== undefined) {
        const withMW = await idsWithMasterWording();
        results = results.filter((a) => withMW.has(a.id) === filters.hasMasterWording);
      }
      if (filters.hasApplicationWording !== undefined) {
        const withAW = await idsWithApplicationWording();
        results = results.filter((a) => withAW.has(a.id) === filters.hasApplicationWording);
      }
      if (filters.usedInWorkspace !== undefined) {
        const usedIds = await idsUsedInWorkspace();
        results = results.filter((a) => usedIds.has(a.id) === filters.usedInWorkspace);
      }

      return results;
    },
  });
}

export function useAchievement(id: string | undefined) {
  return useQuery({
    queryKey: ["achievements", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Achievement;
    },
  });
}

export interface AchievementClassification {
  competencyIds: string[];
  jobTypeIds: string[];
  tagIds: string[];
  projectIds: string[];
}

export function useAchievementClassification(id: string | undefined) {
  return useQuery({
    queryKey: ["achievements", "classification", id],
    enabled: !!id,
    queryFn: async (): Promise<AchievementClassification> => {
      const [comps, jts, tags, projs] = await Promise.all([
        supabase.from("achievement_competencies").select("competency_id").eq("achievement_id", id!),
        supabase.from("achievement_job_types").select("job_type_id").eq("achievement_id", id!),
        supabase.from("achievement_tags").select("tag_id").eq("achievement_id", id!),
        // achievement_relevant_projects, not achievement_projects directly —
        // Compound Achievements' Projects are inherited from their
        // components (migration 0004), so this always reflects the correct
        // resolved set regardless of whether this Achievement is a compound.
        supabase.from("achievement_relevant_projects").select("project_id").eq("achievement_id", id!),
      ]);
      if (comps.error) throw comps.error;
      if (jts.error) throw jts.error;
      if (tags.error) throw tags.error;
      if (projs.error) throw projs.error;
      return {
        competencyIds: (comps.data ?? []).map((r) => r.competency_id),
        jobTypeIds: (jts.data ?? []).map((r) => r.job_type_id),
        tagIds: (tags.data ?? []).map((r) => r.tag_id),
        projectIds: (projs.data ?? []).map((r) => r.project_id),
      };
    },
  });
}

export interface AchievementInput {
  subject: string;
  description?: string | null;
  significance_impact?: string | null;
  feedback?: string | null;
  draft?: string | null;
  notes?: string | null;
  rating: AchievementRating;
  rating_rationale?: string | null;
  competencyIds: string[];
  jobTypeIds: string[];
  tagIds: string[];
  projectIds: string[];
}

async function syncJoinTable(
  table: "achievement_competencies" | "achievement_job_types" | "achievement_tags" | "achievement_projects",
  fkColumn: "competency_id" | "job_type_id" | "tag_id" | "project_id",
  achievementId: string,
  ids: string[],
) {
  const { error: delError } = await supabase.from(table).delete().eq("achievement_id", achievementId);
  if (delError) throw delError;
  if (ids.length === 0) return;
  const rows = ids.map((id) => ({ achievement_id: achievementId, [fkColumn]: id }));
  const { error: insError } = await supabase.from(table).insert(rows);
  if (insError) throw insError;
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AchievementInput) => {
      const { competencyIds, jobTypeIds, tagIds, projectIds, ...achievementFields } = input;
      const { data, error } = await supabase.from("achievements").insert(achievementFields).select().single();
      if (error) throw error;
      const achievement = data as Achievement;
      await Promise.all([
        syncJoinTable("achievement_competencies", "competency_id", achievement.id, competencyIds),
        syncJoinTable("achievement_job_types", "job_type_id", achievement.id, jobTypeIds),
        syncJoinTable("achievement_tags", "tag_id", achievement.id, tagIds),
        syncJoinTable("achievement_projects", "project_id", achievement.id, projectIds),
      ]);
      return achievement;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: AchievementInput & { id: string; status?: Status }) => {
      const { competencyIds, jobTypeIds, tagIds, projectIds, status, ...achievementFields } = input;
      const { data, error } = await supabase
        .from("achievements")
        .update({ ...achievementFields, ...(status ? { status } : {}) })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await Promise.all([
        syncJoinTable("achievement_competencies", "competency_id", id, competencyIds),
        syncJoinTable("achievement_job_types", "job_type_id", id, jobTypeIds),
        syncJoinTable("achievement_tags", "tag_id", id, tagIds),
        syncJoinTable("achievement_projects", "project_id", id, projectIds),
      ]);
      return data as Achievement;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["achievements"] });
      qc.invalidateQueries({ queryKey: ["achievements", "classification", variables.id] });
    },
  });
}

// Narrow edit of just Draft + Notes + Competencies (used from the Workspace Add dialog),
// so callers don't need to round-trip the whole AchievementInput.
export function useQuickEditAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, draft, notes, competencyIds }: { id: string; draft: string | null; notes: string | null; competencyIds: string[] }) => {
      const { error } = await supabase.from("achievements").update({ draft, notes }).eq("id", id);
      if (error) throw error;
      await syncJoinTable("achievement_competencies", "competency_id", id, competencyIds);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["achievements"] });
      // Competencies feed the Workspace include/exclude recommendation.
      qc.invalidateQueries({ queryKey: ["workspaces", "targetMatches"] });
    },
  });
}

export function useSetAchievementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { data, error } = await supabase.from("achievements").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data as Achievement;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}

// Permanent deletion (not archive). Cascades to Master Wordings/versions and
// classification join rows at the DB level; the DB itself RESTRICTs deletion
// if any Application Wording or Workspace still references this Achievement.
// Callers should pre-check usage (see delete-achievement-dialog.tsx) so this
// is only invoked when deletion is actually safe — the DB constraint is a
// backstop, not the primary UX.
export function useDeleteAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }),
  });
}
