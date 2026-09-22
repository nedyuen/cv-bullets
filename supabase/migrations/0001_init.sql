-- BMS — Career Content Management System
-- Phases 1-4 schema.
--
-- SECURITY NOTE: Row Level Security is intentionally left DISABLED on every
-- table below because this app has no authentication (single personal user,
-- local/private use only, per explicit product decision). The anon key used
-- by the client therefore has full read/write access to all data in this
-- project. DO NOT deploy this app to a publicly reachable URL in this state.
-- Before any public deployment: either (a) add Supabase Auth + RLS policies
-- scoped to auth.uid(), or (b) keep the deployment behind a private/unlisted
-- access mechanism (not shared publicly, local-only, or a hosting-level
-- access gate). This warning is intentionally loud and repeated in project
-- docs/handoff notes.

create extension if not exists pg_trgm;

-- ============================================================================
-- Companies
-- ============================================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index companies_name_lower_idx on companies (lower(name));
create index companies_status_idx on companies (status);

-- ============================================================================
-- Career Roles
-- ============================================================================
create table career_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index career_roles_company_id_idx on career_roles (company_id);
create index career_roles_status_idx on career_roles (status);

-- ============================================================================
-- Projects
-- ============================================================================
create table projects (
  id uuid primary key default gen_random_uuid(),
  career_role_id uuid not null references career_roles(id) on delete restrict,
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_career_role_id_idx on projects (career_role_id);
create index projects_status_idx on projects (status);

-- ============================================================================
-- Achievements
-- ============================================================================
create table achievements (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  description text,
  significance_impact text,
  feedback text,
  mandatory boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index achievements_status_idx on achievements (status);
create index achievements_mandatory_idx on achievements (mandatory);
create index achievements_search_trgm_idx on achievements
  using gin ((coalesce(subject, '') || ' ' || coalesce(description, '') || ' ' ||
              coalesce(significance_impact, '') || ' ' || coalesce(feedback, '')) gin_trgm_ops);

create table achievement_projects (
  achievement_id uuid not null references achievements(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  primary key (achievement_id, project_id)
);
create index achievement_projects_project_id_idx on achievement_projects (project_id);

-- ============================================================================
-- Job Types
-- ============================================================================
create table job_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index job_types_name_lower_idx on job_types (lower(name));
create index job_types_status_idx on job_types (status);

create table achievement_job_types (
  achievement_id uuid not null references achievements(id) on delete cascade,
  job_type_id uuid not null references job_types(id) on delete restrict,
  primary key (achievement_id, job_type_id)
);
create index achievement_job_types_job_type_id_idx on achievement_job_types (job_type_id);

-- ============================================================================
-- Competencies
-- ============================================================================
create table competencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index competencies_name_lower_idx on competencies (lower(name));
create index competencies_status_idx on competencies (status);

create table achievement_competencies (
  achievement_id uuid not null references achievements(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete restrict,
  primary key (achievement_id, competency_id)
);
create index achievement_competencies_competency_id_idx on achievement_competencies (competency_id);

-- ============================================================================
-- Tags (free-created)
-- ============================================================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create unique index tags_name_lower_idx on tags (lower(name));

create table achievement_tags (
  achievement_id uuid not null references achievements(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete restrict,
  primary key (achievement_id, tag_id)
);
create index achievement_tags_tag_id_idx on achievement_tags (tag_id);

-- ============================================================================
-- Master Wordings (+ versions, + Job Type associations)
-- ============================================================================
create table master_wordings (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references achievements(id) on delete cascade,
  current_version_id uuid, -- FK added after master_wording_versions exists
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index master_wordings_achievement_id_idx on master_wordings (achievement_id);
create index master_wordings_status_idx on master_wordings (status);

create table master_wording_versions (
  id uuid primary key default gen_random_uuid(),
  master_wording_id uuid not null references master_wordings(id) on delete cascade,
  version_number integer not null,
  text text not null,
  change_note text,
  created_at timestamptz not null default now(),
  unique (master_wording_id, version_number)
);
create index master_wording_versions_master_wording_id_idx on master_wording_versions (master_wording_id);

alter table master_wordings
  add constraint master_wordings_current_version_id_fkey
  foreign key (current_version_id) references master_wording_versions(id) on delete set null;
create index master_wordings_current_version_id_idx on master_wordings (current_version_id);

create table master_wording_job_types (
  master_wording_id uuid not null references master_wordings(id) on delete cascade,
  job_type_id uuid not null references job_types(id) on delete restrict,
  primary key (master_wording_id, job_type_id)
);
create index master_wording_job_types_job_type_id_idx on master_wording_job_types (job_type_id);

-- ============================================================================
-- Job Applications
-- ============================================================================
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  job_title text not null,
  job_type_id uuid references job_types(id) on delete set null,
  date_applied date,
  job_posting_url text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_applications_company_id_idx on job_applications (company_id);
create index job_applications_job_type_id_idx on job_applications (job_type_id);
create index job_applications_status_idx on job_applications (status);

-- ============================================================================
-- Application Wordings (+ versions, + Achievement links)
-- ============================================================================
create table application_wordings (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references job_applications(id) on delete cascade,
  current_version_id uuid, -- FK added after application_wording_versions exists
  source_master_wording_id uuid references master_wordings(id) on delete set null,
  source_master_wording_version_id uuid references master_wording_versions(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index application_wordings_job_application_id_idx on application_wordings (job_application_id);
create index application_wordings_source_master_wording_id_idx on application_wordings (source_master_wording_id);
create index application_wordings_status_idx on application_wordings (status);

create table application_wording_versions (
  id uuid primary key default gen_random_uuid(),
  application_wording_id uuid not null references application_wordings(id) on delete cascade,
  version_number integer not null,
  text text not null,
  created_at timestamptz not null default now(),
  unique (application_wording_id, version_number)
);
create index application_wording_versions_application_wording_id_idx on application_wording_versions (application_wording_id);

alter table application_wordings
  add constraint application_wordings_current_version_id_fkey
  foreign key (current_version_id) references application_wording_versions(id) on delete set null;
create index application_wordings_current_version_id_idx on application_wordings (current_version_id);

create table application_wording_achievements (
  application_wording_id uuid not null references application_wordings(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete restrict,
  display_order integer not null default 0,
  primary key (application_wording_id, achievement_id)
);
create index application_wording_achievements_achievement_id_idx on application_wording_achievements (achievement_id);
create index application_wording_achievements_order_idx on application_wording_achievements (application_wording_id, display_order);

-- ============================================================================
-- CV Workspaces
-- ============================================================================
create table cv_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job_type_id uuid references job_types(id) on delete set null,
  job_application_id uuid references job_applications(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cv_workspaces_job_type_id_idx on cv_workspaces (job_type_id);
create index cv_workspaces_job_application_id_idx on cv_workspaces (job_application_id);
create index cv_workspaces_status_idx on cv_workspaces (status);

create table cv_workspace_achievements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cv_workspaces(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete restrict,
  selected_master_wording_id uuid references master_wordings(id) on delete set null,
  selected_master_wording_version_id uuid references master_wording_versions(id) on delete set null,
  snapshot_text text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, achievement_id)
);
create index cv_workspace_achievements_achievement_id_idx on cv_workspace_achievements (achievement_id);
create index cv_workspace_achievements_order_idx on cv_workspace_achievements (workspace_id, display_order);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'career_roles', 'projects', 'achievements', 'job_types',
    'competencies', 'master_wordings', 'job_applications',
    'application_wordings', 'cv_workspaces', 'cv_workspace_achievements'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- Job Type inheritance view — the single authoritative source for
-- "an Achievement's relevant Job Types = direct tags UNION Job Types on any
-- of its Master Wordings" (spec §15). Every screen must read this view
-- rather than re-deriving the union itself.
-- ============================================================================
create view achievement_relevant_job_types as
  select achievement_id, job_type_id, 'direct'::text as source
  from achievement_job_types
  union
  select mw.achievement_id, mwjt.job_type_id, 'inherited'::text as source
  from master_wording_job_types mwjt
  join master_wordings mw on mw.id = mwjt.master_wording_id
  where mw.status = 'active';

comment on view achievement_relevant_job_types is
  'Authoritative union of direct Achievement Job Types and Job Types inherited from active Master Wordings. Do not reimplement this logic client-side.';
