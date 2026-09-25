// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Keep in sync manually — there is no generated-types step in this project.

export type Status = "active" | "archived";

export interface Company {
  id: string;
  name: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface CareerRole {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  career_role_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  subject: string;
  description: string | null;
  significance_impact: string | null;
  feedback: string | null;
  notes: string | null;
  mandatory: boolean;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface AchievementProject {
  achievement_id: string;
  project_id: string;
}

export interface JobType {
  id: string;
  name: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface AchievementJobType {
  achievement_id: string;
  job_type_id: string;
}

export interface Competency {
  id: string;
  name: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface AchievementCompetency {
  achievement_id: string;
  competency_id: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface AchievementTag {
  achievement_id: string;
  tag_id: string;
}

export interface MasterWording {
  id: string;
  achievement_id: string;
  current_version_id: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface MasterWordingVersion {
  id: string;
  master_wording_id: string;
  version_number: number;
  text: string;
  change_note: string | null;
  created_at: string;
}

export interface MasterWordingJobType {
  master_wording_id: string;
  job_type_id: string;
}

export interface JobApplication {
  id: string;
  company_id: string;
  job_title: string;
  job_type_id: string | null;
  date_applied: string | null;
  job_posting_url: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWording {
  id: string;
  job_application_id: string;
  current_version_id: string | null;
  source_master_wording_id: string | null;
  source_master_wording_version_id: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWordingVersion {
  id: string;
  application_wording_id: string;
  version_number: number;
  text: string;
  created_at: string;
}

export interface ApplicationWordingAchievement {
  application_wording_id: string;
  achievement_id: string;
  display_order: number;
}

export interface CvWorkspace {
  id: string;
  name: string;
  job_type_id: string | null;
  job_application_id: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface CvWorkspaceAchievement {
  id: string;
  workspace_id: string;
  achievement_id: string;
  selected_master_wording_id: string | null;
  selected_master_wording_version_id: string | null;
  snapshot_text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CompoundAchievementComponent {
  compound_achievement_id: string;
  component_achievement_id: string;
  display_order: number;
}

export interface AchievementRelevantJobType {
  achievement_id: string;
  job_type_id: string;
  source: "direct" | "inherited";
}
