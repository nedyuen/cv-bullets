import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Project, Status } from "@/types/database";

export interface ProjectWithContext extends Project {
  career_roles: { id: string; title: string; companies: { id: string; name: string } | null } | null;
}

export function useProjects(includeArchived = false, careerRoleId?: string) {
  return useQuery({
    queryKey: ["projects", includeArchived, careerRoleId],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, career_roles(id, title, companies(id, name))")
        .order("start_date", { ascending: false });
      if (!includeArchived) query = query.eq("status", "active");
      if (careerRoleId) query = query.eq("career_role_id", careerRoleId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProjectWithContext[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, career_roles(id, title, companies(id, name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as ProjectWithContext;
    },
  });
}

export interface ProjectInput {
  career_role_id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { data, error } = await supabase.from("projects").insert(input).select().single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ProjectInput> & { id: string; status?: Status }) => {
      const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useProjectAchievementCounts() {
  return useQuery({
    queryKey: ["projects", "achievementCounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achievement_projects").select("project_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
      }
      return counts;
    },
  });
}
