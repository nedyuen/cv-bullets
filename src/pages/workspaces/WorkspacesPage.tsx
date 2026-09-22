import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WorkspaceFormDialog } from "@/components/workspace/workspace-form-dialog";
import { useWorkspaces } from "@/hooks/useWorkspaces";

export function WorkspacesPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const workspaces = useWorkspaces(includeArchived);

  return (
    <div>
      <PageHeader
        title="CV Workspaces"
        description="Assemble a targeted CV draft from your Achievement library."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="includeArchivedWorkspaces" checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
              <Label htmlFor="includeArchivedWorkspaces" className="font-normal text-sm">
                Include Archived
              </Label>
            </div>
            <WorkspaceFormDialog />
          </div>
        }
      />
      <div className="space-y-2">
        {(workspaces.data ?? []).map((w) => (
          <Link key={w.id} to={`/workspaces/${w.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{w.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.job_types?.name ?? "No target Job Type"}
                    {w.job_applications && ` · Linked to ${w.job_applications.companies?.name} — ${w.job_applications.job_title}`}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </CardContent>
            </Card>
          </Link>
        ))}
        {workspaces.data?.length === 0 && <EmptyState title="No Workspaces yet" description="Create your first CV Workspace to start assembling a draft." />}
      </div>
    </div>
  );
}
