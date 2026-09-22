import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CareerRole, Status } from "@/types/database";

export interface CareerRoleWithCompany extends CareerRole {
  companies: { id: string; name: string } | null;
}

export function useCareerRoles(includeArchived = false, companyId?: string) {
  return useQuery({
    queryKey: ["careerRoles", includeArchived, companyId],
    queryFn: async () => {
      let query = supabase
        .from("career_roles")
        .select("*, companies(id, name)")
        .order("start_date", { ascending: false });
      if (!includeArchived) query = query.eq("status", "active");
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CareerRoleWithCompany[];
    },
  });
}

export function useCareerRole(id: string | undefined) {
  return useQuery({
    queryKey: ["careerRoles", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_roles")
        .select("*, companies(id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as CareerRoleWithCompany;
    },
  });
}

export interface CareerRoleInput {
  company_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export function useCreateCareerRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CareerRoleInput) => {
      const { data, error } = await supabase.from("career_roles").insert(input).select().single();
      if (error) throw error;
      return data as CareerRole;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careerRoles"] }),
  });
}

export function useUpdateCareerRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CareerRoleInput> & { id: string; status?: Status }) => {
      const { data, error } = await supabase.from("career_roles").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as CareerRole;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careerRoles"] }),
  });
}
