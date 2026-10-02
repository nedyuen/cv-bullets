-- Decouple Job Application's Company from the shared `companies` table (used
-- for Career Roles / actual employers) to stop companies that exist only
-- because of a Job Application from polluting Career-context company lists.
-- Job Applications now store their company as a plain denormalized text
-- field instead of an FK into `companies`.
--
-- Purely additive + loosening, never destructive: the existing company_id
-- column and its historical data are left untouched (just made nullable and
-- no longer populated going forward), and company_name is backfilled from
-- the existing join so no information is lost for current rows.

alter table job_applications add column company_name text;

update job_applications
set company_name = companies.name
from companies
where companies.id = job_applications.company_id;

alter table job_applications alter column company_name set not null;

-- No longer populated for new rows — kept nullable, and kept at all, purely
-- for existing rows' historical continuity. Never dropped.
alter table job_applications alter column company_id drop not null;

comment on column job_applications.company_id is
  'Deprecated/historical only -- Job Applications no longer link into the shared companies table used by Career Roles. See company_name. Left in place (nullable) for existing rows'' continuity only; the app never writes it for new rows.';
