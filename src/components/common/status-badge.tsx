import { Badge } from "@/components/ui/badge";
import type { Status } from "@/types/database";

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
