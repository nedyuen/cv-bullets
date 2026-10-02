-- One-time cleanup, explicitly requested and authorized by the owner: the
-- companies table was polluted by "ghost" companies created via Job
-- Applications before migration 0007 decoupled Job Applications from this
-- table. Keep only the five real past employers; permanently delete
-- everything else. Case-insensitive, trimmed match.
--
-- Must run AFTER 0007 (depends on company_name already being backfilled and
-- company_id already being nullable/deprecated).

-- job_applications.company_id is already deprecated/unused as of migration
-- 0007 (company_name is authoritative there) — null it out wherever it
-- still points to a company about to be deleted, otherwise its
-- "on delete restrict" FK would block the delete below.
update job_applications
set company_id = null
where company_id in (
  select id from companies
  where lower(trim(name)) not in ('accenture', 'goldman sachs', 'jp morgan', 'morgan stanley', 'ubs')
);

-- career_roles.company_id is deliberately NOT touched — it's also
-- "on delete restrict". If a company below still has a career_roles row,
-- this delete fails for that row instead of silently discarding real
-- career history. That failure is a safety signal: it means a genuine past
-- employer is hiding among the "ghosts" and needs to be added to the
-- keep-list above before re-running, not forced through.
delete from companies
where lower(trim(name)) not in ('accenture', 'goldman sachs', 'jp morgan', 'morgan stanley', 'ubs');
