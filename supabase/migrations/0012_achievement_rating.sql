-- Replace the Mandatory/Optional flag on an Achievement with a three-level
-- rating (high / medium / low) plus an optional short rationale for it.
-- Existing data converts as: Mandatory -> high, Optional -> low.

alter table achievements
  add column rating text not null default 'low' check (rating in ('high', 'medium', 'low')),
  add column rating_rationale text;

update achievements set rating = case when mandatory then 'high' else 'low' end;

drop index if exists achievements_mandatory_idx;
alter table achievements drop column mandatory;

create index achievements_rating_idx on achievements (rating);
