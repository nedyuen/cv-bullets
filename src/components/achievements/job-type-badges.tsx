import { Badge } from "@/components/ui/badge";
import type { RelevantJobTypesByAchievement } from "@/lib/jobTypeInheritance";
import type { JobType } from "@/types/database";

export function JobTypeBadges({
  relevant,
  jobTypesById,
}: {
  relevant: RelevantJobTypesByAchievement | undefined;
  jobTypesById: Map<string, JobType>;
}) {
  if (!relevant || (relevant.direct.size === 0 && relevant.inherited.size === 0)) {
    return <span className="text-xs text-muted-foreground">No relevant Job Types yet</span>;
  }
  const directOnly = [...relevant.direct];
  const inheritedOnly = [...relevant.inherited].filter((id) => !relevant.direct.has(id));

  return (
    <div className="flex flex-wrap gap-1">
      {directOnly.map((id) => (
        <Badge key={`d-${id}`} variant="secondary" title="Direct Job Type">
          {jobTypesById.get(id)?.name ?? id}
        </Badge>
      ))}
      {inheritedOnly.map((id) => (
        <Badge key={`i-${id}`} variant="outline" title="Inherited from a Master Wording">
          {jobTypesById.get(id)?.name ?? id} (inherited)
        </Badge>
      ))}
    </div>
  );
}
