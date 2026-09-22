import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobApplicationFormDialog } from "@/components/applications/job-application-form-dialog";
import { ApplicationWordingCard } from "@/components/applications/application-wording-card";
import { AddApplicationWordingDialog } from "@/components/applications/add-application-wording-dialog";
import { useToast } from "@/components/ui/toast";
import { useJobApplication, useJobApplications, useUpdateJobApplication } from "@/hooks/useJobApplications";
import { useApplicationWordingsForApplication } from "@/hooks/useApplicationWordings";
import { useWorkspacesForApplication } from "@/hooks/useWorkspaces";
import { Archive, RotateCcw } from "lucide-react";

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const application = useJobApplication(id);
  const wordings = useApplicationWordingsForApplication(id);
  const workspaces = useWorkspacesForApplication(id);
  const allApplications = useJobApplications();
  const updateApplication = useUpdateJobApplication();
  const { toast } = useToast();

  if (!application.data) return null;
  const app = application.data;

  // Retrieval/inspiration only — not a recommendation engine (spec §43).
  const similar = (allApplications.data ?? []).filter((a) => a.id !== app.id && app.job_type_id && a.job_type_id === app.job_type_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${app.companies?.name} — ${app.job_title}`}
        description={app.job_posting_url ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <JobApplicationFormDialog application={app} />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateApplication.mutate(
                  { id: app.id, status: app.status === "active" ? "archived" : "active" },
                  { onSuccess: () => toast({ title: app.status === "active" ? "Archived" : "Restored" }) },
                )
              }
            >
              {app.status === "active" ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              {app.status === "active" ? "Archive" : "Restore"}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={app.status} />
        {app.job_types?.name && <Badge variant="secondary">{app.job_types.name}</Badge>}
        {app.date_applied && <Badge variant="outline">Applied {app.date_applied}</Badge>}
      </div>

      {(workspaces.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {workspaces.data!.map((w) => (
              <Link key={w.id} to={`/workspaces/${w.id}`}>
                <Badge variant="secondary">{w.name}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Application Wordings</h2>
          <AddApplicationWordingDialog jobApplicationId={app.id} />
        </div>
        <div className="space-y-3">
          {(wordings.data ?? []).map((w) => (
            <ApplicationWordingCard key={w.id} wording={w} showApplicationLink={false} />
          ))}
          {wordings.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No wording saved yet. Build a CV Workspace and use "Save as Application Wording", or add one from scratch above.
            </p>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar Applications (same Job Type)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {similar.map((a) => (
              <Link key={a.id} to={`/applications/${a.id}`} className="text-sm hover:underline">
                {a.companies?.name} — {a.job_title}
                {a.date_applied && <span className="text-muted-foreground"> · {a.date_applied}</span>}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
