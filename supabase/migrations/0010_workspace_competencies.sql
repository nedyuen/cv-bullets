-- A CV Workspace can now target Competencies (multi-select) in addition to a
-- Job Type. Used to recommend which Achievements to include when building
-- the CV (see add-achievement-dialog.tsx).
create table cv_workspace_competencies (
  workspace_id uuid not null references cv_workspaces(id) on delete cascade,
  competency_id uuid not null references competencies(id),
  primary key (workspace_id, competency_id)
);

alter table cv_workspace_competencies enable row level security;
create policy "authenticated_all_access" on cv_workspace_competencies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
