-- Single-user access control: every table now requires an authenticated
-- Supabase Auth session. There is exactly one account (created by the owner
-- directly in the Supabase Dashboard — no public sign-up exists anywhere in
-- the app), so a simple "is logged in" check is sufficient; no per-row
-- ownership column is needed. Purely additive — RLS is restrictive on top of
-- existing grants, no rows are touched, nothing is dropped.

alter table companies enable row level security;
create policy "authenticated_all_access" on companies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table career_roles enable row level security;
create policy "authenticated_all_access" on career_roles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table projects enable row level security;
create policy "authenticated_all_access" on projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table achievements enable row level security;
create policy "authenticated_all_access" on achievements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table achievement_projects enable row level security;
create policy "authenticated_all_access" on achievement_projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table job_types enable row level security;
create policy "authenticated_all_access" on job_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table achievement_job_types enable row level security;
create policy "authenticated_all_access" on achievement_job_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table competencies enable row level security;
create policy "authenticated_all_access" on competencies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table achievement_competencies enable row level security;
create policy "authenticated_all_access" on achievement_competencies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table tags enable row level security;
create policy "authenticated_all_access" on tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table achievement_tags enable row level security;
create policy "authenticated_all_access" on achievement_tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table master_wordings enable row level security;
create policy "authenticated_all_access" on master_wordings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table master_wording_versions enable row level security;
create policy "authenticated_all_access" on master_wording_versions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table master_wording_job_types enable row level security;
create policy "authenticated_all_access" on master_wording_job_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table job_applications enable row level security;
create policy "authenticated_all_access" on job_applications
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table application_wordings enable row level security;
create policy "authenticated_all_access" on application_wordings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table application_wording_versions enable row level security;
create policy "authenticated_all_access" on application_wording_versions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table application_wording_achievements enable row level security;
create policy "authenticated_all_access" on application_wording_achievements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table cv_workspaces enable row level security;
create policy "authenticated_all_access" on cv_workspaces
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table cv_workspace_achievements enable row level security;
create policy "authenticated_all_access" on cv_workspace_achievements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table compound_achievement_components enable row level security;
create policy "authenticated_all_access" on compound_achievement_components
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Views bypass RLS by default (they run with the view owner's privileges,
-- not the querying user's) unless explicitly told to respect it.
alter view achievement_relevant_job_types set (security_invoker = true);
alter view achievement_relevant_projects set (security_invoker = true);
