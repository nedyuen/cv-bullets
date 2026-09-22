import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { JobApplicationFormDialog } from "@/components/applications/job-application-form-dialog";
import { useJobApplications } from "@/hooks/useJobApplications";

export function ApplicationsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const applications = useJobApplications(includeArchived);

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Specific opportunities you've applied to."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="includeArchivedApplications" checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
              <Label htmlFor="includeArchivedApplications" className="font-normal text-sm">
                Include Archived
              </Label>
            </div>
            <JobApplicationFormDialog />
          </div>
        }
      />
      <div className="space-y-2">
        {(applications.data ?? []).map((app) => (
          <Link key={app.id} to={`/applications/${app.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {app.companies?.name} — {app.job_title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {app.job_types?.name ?? "No Job Type"} {app.date_applied && `· Applied ${app.date_applied}`}
                  </p>
                </div>
                {app.status === "archived" && <StatusBadge status={app.status} />}
              </CardContent>
            </Card>
          </Link>
        ))}
        {applications.data?.length === 0 && <EmptyState title="No Applications yet" description="Add your first Job Application." />}
      </div>
    </div>
  );
}
