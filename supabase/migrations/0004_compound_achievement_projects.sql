-- Compound Achievements inherit Projects from their components (recursively,
-- for nested compounds) instead of having Projects manually selected — a
-- single computed source of truth, same philosophy as
-- achievement_relevant_job_types (spec §15), applied to Projects specifically
-- per an explicit product decision narrowing spec §24's "gets its own
-- Projects" for Compound Achievements only. Competencies, direct Job Types
-- and Tags remain manually set for Compound Achievements as before.

create view achievement_relevant_projects as
with recursive compound_tree as (
  select compound_achievement_id, component_achievement_id
  from compound_achievement_components
  union
  select ct.compound_achievement_id, cac.component_achievement_id
  from compound_tree ct
  join compound_achievement_components cac on cac.compound_achievement_id = ct.component_achievement_id
)
-- Non-compound Achievements: their own direct Projects.
select ap.achievement_id, ap.project_id
from achievement_projects ap
where not exists (select 1 from compound_achievement_components c where c.compound_achievement_id = ap.achievement_id)
union
-- Compound Achievements: union of every (recursively resolved) descendant's
-- direct Projects, counting only LEAF descendants — the `not exists` here
-- means a mid-tree descendant that is itself a compound never contributes
-- its own (possibly stale, pre-compound) direct rows, so this stays correct
-- for nested compounds without needing any cleanup step elsewhere.
select ct.compound_achievement_id as achievement_id, ap.project_id
from compound_tree ct
join achievement_projects ap on ap.achievement_id = ct.component_achievement_id
where not exists (select 1 from compound_achievement_components c2 where c2.compound_achievement_id = ct.component_achievement_id);

comment on view achievement_relevant_projects is
  'Authoritative Projects for an Achievement: direct rows for normal Achievements, recursively-resolved union of components'' Projects for Compound Achievements. Do not reimplement this logic client-side.';
