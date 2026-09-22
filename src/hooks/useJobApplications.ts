import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { JobApplication, Status } from "@/types/database";

export interface JobApplicationWithContext extends JobApplication {
  companies: { id: string; name: string } | null;
  job_types: { id: string; name: string } | null;
}

export function useJobApplications(includeArchived = false) {
  return useQuery({
    queryKey: ["jobApplications", includeArchived],
    queryFn: async () => {
      let query = supabase
        .from("job_applications")
        .select("*, companies(id, name), job_types(id, name)")
        .order("date_applied", { ascending: false, nullsFirst: false });
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as JobApplicationWithContext[];
    },
  });
}

export function useJobApplication(id: string | undefined) {
  return useQuery({
    queryKey: ["jobApplications", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, companies(id, name), job_types(id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as JobApplicationWithContext;
    },
  });
}

export interface JobApplicationInput {
  company_id: string;
  job_title: string;
  job_type_id?: string | null;
  date_applied?: string | null;
  job_posting_url?: string | null;
}

export function useCreateJobApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: JobApplicationInput) => {
      const { data, error } = await supabase.from("job_applications").insert(input).select().single();
      if (error) throw error;
      return data as JobApplication;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobApplications"] }),
  });
}

export function useUpdateJobApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<JobApplicationInput> & { id: string; status?: Status }) => {
      const { data, error } = await supabase.from("job_applications").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as JobApplication;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobApplications"] }),
  });
}
