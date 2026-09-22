import { useQuery } from "@tanstack/react-query";
import { fetchRelevantJobTypes, groupRelevantJobTypes } from "@/lib/jobTypeInheritance";

export function useRelevantJobTypesMap(achievementIds: string[]) {
  return useQuery({
    queryKey: ["relevantJobTypes", [...achievementIds].sort()],
    enabled: achievementIds.length > 0,
    queryFn: async () => {
      const rows = await fetchRelevantJobTypes(achievementIds);
      return groupRelevantJobTypes(rows);
    },
  });
}
