-- job_applications.company_id has been fully superseded by company_name
-- (migration 0007) and confirmed unused anywhere in the app. Safe to drop
-- now that the ghost-company cleanup (0008) has run: company_name already
-- carries everything company_id carried (it was backfilled from it), so no
-- information is lost by removing this column.
alter table job_applications drop column company_id;
