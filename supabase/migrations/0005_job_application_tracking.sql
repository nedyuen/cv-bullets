-- Job Applications: track target salary and pipeline stage. Purely additive
-- (new nullable/defaulted columns) — no existing data is touched or removed.
--
-- Note: the Company field on a Job Application was already an FK to
-- `companies` (shared with Career Roles, spec §7); this migration does not
-- change that. What changes is UI-only — the Company picker becomes a
-- creatable combobox so applying to a brand new company (one with no Career
-- Role history) no longer requires pre-creating it elsewhere first.

alter table job_applications add column target_salary text;

alter table job_applications add column application_stage text not null default 'pending_application'
  check (application_stage in ('pending_application', 'applied', 'pending_interview', 'interviewed', 'rejected'));

create index job_applications_application_stage_idx on job_applications (application_stage);
