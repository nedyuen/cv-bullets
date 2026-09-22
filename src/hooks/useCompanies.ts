import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Company, Status } from "@/types/database";

export function useCompanies(includeArchived = false) {
  return useQuery({
    queryKey: ["companies", includeArchived],
    queryFn: async () => {
      let query = supabase.from("companies").select("*").order("name");
      if (!includeArchived) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ["companies", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Company;
    },
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("companies").insert({ name }).select().single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; status?: Status }) => {
      const { data, error } = await supabase.from("companies").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}
