-- Phase 5: Compound Achievements (spec §24-25).
--
-- A Compound Achievement is just a normal Achievement row whose "components"
-- are other Achievements (which may themselves be compounds — nesting is
-- allowed, spec §25). This table only records that composition.
--
-- Self-reference is rejected at the DB level via a CHECK constraint.
-- Indirect cycles (A -> B -> C -> A) are NOT enforced here — Postgres has no
-- simple constraint for "no cycle in a graph", and per the product principle
-- of avoiding unnecessary complexity, that check is done in the application
-- before insert (see src/lib/compoundCycles.ts), where the full component
-- graph is small enough to walk directly.

create table compound_achievement_components (
  compound_achievement_id uuid not null references achievements(id) on delete cascade,
  component_achievement_id uuid not null references achievements(id) on delete cascade,
  display_order integer not null default 0,
  primary key (compound_achievement_id, component_achievement_id),
  constraint compound_achievement_no_self_reference check (compound_achievement_id != component_achievement_id)
);
create index compound_achievement_components_component_id_idx on compound_achievement_components (component_achievement_id);
create index compound_achievement_components_order_idx on compound_achievement_components (compound_achievement_id, display_order);
