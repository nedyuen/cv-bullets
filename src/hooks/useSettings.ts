import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Competency, JobType, Status, Tag } from "@/types/database";

// ---------------------------------------------------------------------------
// Job Types
// ---------------------------------------------------------------------------
export function useJobTypes(includeArchived = false) {
  return useQuery({
    queryKey: ["jobTypes", includeArchived],
    queryFn: async () => {
      let query = supabase.from("job_types").select("*").order("name");
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as JobType[];
    },
  });
}

export function useCreateJobType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("job_types").insert({ name }).select().single();
      if (error) throw error;
      return data as JobType;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobTypes"] }),
  });
}

export function useUpdateJobType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; status?: Status }) => {
      const { data, error } = await supabase.from("job_types").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as JobType;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobTypes"] }),
  });
}

// ---------------------------------------------------------------------------
// Competencies
// ---------------------------------------------------------------------------
export function useCompetencies(includeArchived = false) {
  return useQuery({
    queryKey: ["competencies", includeArchived],
    queryFn: async () => {
      let query = supabase.from("competencies").select("*").order("name");
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as Competency[];
    },
  });
}

export function useCreateCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("competencies").insert({ name }).select().single();
      if (error) throw error;
      return data as Competency;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competencies"] }),
  });
}

export function useUpdateCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; status?: Status }) => {
      const { data, error } = await supabase.from("competencies").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Competency;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competencies"] }),
  });
}

// ---------------------------------------------------------------------------
// Tags (free-created, no archive — simple create/list)
// ---------------------------------------------------------------------------
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      // Tags are uniquely constrained case-insensitively (unique index on
      // lower(name)), which ON CONFLICT can't target via a plain column list,
      // so find-or-create explicitly instead of upserting.
      const { data: existing, error: findError } = await supabase
        .from("tags")
        .select("*")
        .ilike("name", name)
        .maybeSingle();
      if (findError) throw findError;
      if (existing) return existing as Tag;

      const { data, error } = await supabase.from("tags").insert({ name }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
