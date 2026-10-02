import { Badge } from "@/components/ui/badge";
import type { ApplicationStage, Status } from "@/types/database";
import { APPLICATION_STAGES } from "@/hooks/useJobApplications";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status === "active" ? "success" : "secondary"}>
      {status === "active" ? "Active" : "Archived"}
    </Badge>
  );
}

export function MandatoryBadge({ mandatory }: { mandatory: boolean }) {
  return <Badge variant={mandatory ? "warning" : "outline"}>{mandatory ? "Mandatory" : "Optional"}</Badge>;
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
