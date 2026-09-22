import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CvWorkspace, CvWorkspaceAchievement, Status } from "@/types/database";

export interface WorkspaceWithContext extends CvWorkspace {
  job_types: { id: string; name: string } | null;
  job_applications: { id: string; job_title: string; companies: { id: string; name: string } | null } | null;
}

export function useWorkspaces(includeArchived = false) {
  return useQuery({
    queryKey: ["workspaces", includeArchived],
    queryFn: async () => {
      let query = supabase
        .from("cv_workspaces")
        .select("*, job_types(id, name), job_applications(id, job_title, companies(id, name))")
        .order("updated_at", { ascending: false });
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WorkspaceWithContext[];
    },
  });
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_workspaces")
        .select("*, job_types(id, name), job_applications(id, job_title, companies(id, name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as WorkspaceWithContext;
    },
  });
}

export interface WorkspaceInput {
  name: string;
  job_type_id?: string | null;
  job_application_id?: string | null;
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WorkspaceInput) => {
      const { data, error } = await supabase.from("cv_workspaces").insert(input).select().single();
      if (error) throw error;
      return data as CvWorkspace;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<WorkspaceInput> & { id: string; status?: Status }) => {
      const { data, error } = await supabase.from("cv_workspaces").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as CvWorkspace;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useWorkspacesForApplication(jobApplicationId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", "byApplication", jobApplicationId],
    enabled: !!jobApplicationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("cv_workspaces").select("*").eq("job_application_id", jobApplicationId!);
      if (error) throw error;
      return data as CvWorkspace[];
    },
  });
}

// ---------------------------------------------------------------------------
// Workspace items
// ---------------------------------------------------------------------------
export interface WorkspaceItemWithAchievement extends CvWorkspaceAchievement {
  achievements: { id: string; subject: string; mandatory: boolean } | null;
}

export function useWorkspaceItems(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspaceItems", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_workspace_achievements")
        .select("*, achievements(id, subject, mandatory)")
        .eq("workspace_id", workspaceId!)
        .order("display_order");
      if (error) throw error;
      return data as unknown as WorkspaceItemWithAchievement[];
    },
  });
}

export interface AddWorkspaceItemInput {
  workspaceId: string;
  achievementId: string;
  snapshotText: string;
  selectedMasterWordingId?: string | null;
  selectedMasterWordingVersionId?: string | null;
}

export function useAddWorkspaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddWorkspaceItemInput) => {
      const { count, error: countErr } = await supabase
        .from("cv_workspace_achievements")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", input.workspaceId);
      if (countErr) throw countErr;

      const { data, error } = await supabase
        .from("cv_workspace_achievements")
        .insert({
          workspace_id: input.workspaceId,
          achievement_id: input.achievementId,
          snapshot_text: input.snapshotText,
          selected_master_wording_id: input.selectedMasterWordingId ?? null,
          selected_master_wording_version_id: input.selectedMasterWordingVersionId ?? null,
          display_order: count ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CvWorkspaceAchievement;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["workspaceItems", vars.workspaceId] }),
  });
}

// Manual edit of the Workspace's own working copy — never writes back to the
// Master Wording (spec §30, amendment: snapshot is user-editable in place).
export function useUpdateWorkspaceItemText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, snapshotText, workspaceId }: { id: string; snapshotText: string; workspaceId: string }) => {
      const { data, error } = await supabase
        .from("cv_workspace_achievements")
        .update({ snapshot_text: snapshotText })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, workspaceId } as CvWorkspaceAchievement & { workspaceId: string };
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["workspaceItems", data.workspaceId] }),
  });
}

// Explicit re-pick of a different Master Wording/version — overwrites the snapshot.
export function useReplaceWorkspaceItemWording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      workspaceId,
      snapshotText,
      selectedMasterWordingId,
      selectedMasterWordingVersionId,
    }: {
      id: string;
      workspaceId: string;
      snapshotText: string;
      selectedMasterWordingId: string | null;
      selectedMasterWordingVersionId: string | null;
    }) => {
      const { data, error } = await supabase
        .from("cv_workspace_achievements")
        .update({
          snapshot_text: snapshotText,
          selected_master_wording_id: selectedMasterWordingId,
          selected_master_wording_version_id: selectedMasterWordingVersionId,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, workspaceId } as CvWorkspaceAchievement & { workspaceId: string };
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["workspaceItems", data.workspaceId] }),
  });
}

export function useReorderWorkspaceItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, orderedIds }: { workspaceId: string; orderedIds: string[] }) => {
      await Promise.all(
        orderedIds.map((id, index) => supabase.from("cv_workspace_achievements").update({ display_order: index }).eq("id", id)),
      );
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["workspaceItems", vars.workspaceId] }),
  });
}

// Usage view for Achievement detail (spec §42 item 8): which Workspaces
// currently include this Achievement.
export function useWorkspaceUsageForAchievement(achievementId: string | undefined) {
  return useQuery({
    queryKey: ["workspaceUsage", achievementId],
    enabled: !!achievementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_workspace_achievements")
        .select("id, workspace_id, cv_workspaces(id, name, status)")
        .eq("achievement_id", achievementId!);
      if (error) throw error;
      return data as unknown as Array<{ id: string; workspace_id: string; cv_workspaces: { id: string; name: string; status: Status } | null }>;
    },
  });
}

export function useRemoveWorkspaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from("cv_workspace_achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["workspaceItems", vars.workspaceId] }),
  });
}
