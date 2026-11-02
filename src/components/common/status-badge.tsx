import { Badge } from "@/components/ui/badge";
import type { AchievementRating, ApplicationStage, Status } from "@/types/database";
import { APPLICATION_STAGES } from "@/hooks/useJobApplications";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status === "active" ? "success" : "secondary"}>
      {status === "active" ? "Active" : "Archived"}
    </Badge>
  );
}

const RATING_VARIANT: Record<AchievementRating, "warning" | "secondary" | "outline"> = {
  high: "warning",
  medium: "secondary",
  low: "outline",
};

export function RatingBadge({ rating }: { rating: AchievementRating }) {
  return <Badge variant={RATING_VARIANT[rating]}>{rating[0].toUpperCase() + rating.slice(1)}</Badge>;
}

const STAGE_VARIANT: Record<ApplicationStage, "outline" | "secondary" | "warning" | "success" | "destructive"> = {
  pending_application: "outline",
  applied: "secondary",
  pending_interview: "warning",
  interviewed: "success",
  rejected: "destructive",
};

export function ApplicationStageBadge({ stage }: { stage: ApplicationStage }) {
  const label = APPLICATION_STAGES.find((s) => s.value === stage)?.label ?? stage;
  return <Badge variant={STAGE_VARIANT[stage]}>{label}</Badge>;
}
