import { useState } from "react";
import { Archive, RotateCcw, Pencil } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ProjectFormDialog } from "@/components/career/project-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProjects, useProjectAchievementCounts, useUpdateProject } from "@/hooks/useProjects";

export function ProjectsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const projects = useProjects(includeArchived);
  const counts = useProjectAchievementCounts();
  const updateProject = useUpdateProject();

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Work undertaken within a Career Role."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="includeArchivedProjects" checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
              <Label htmlFor="includeArchivedProjects" className="font-normal text-sm">
                Include Archived
              </Label>
            </div>
            <ProjectFormDialog />
          </div>
        }
      />
      <div className="space-y-2">
        {(projects.data ?? []).map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.career_roles?.title} — {p.career_roles?.companies?.name}
                </p>
                {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">{counts.data?.get(p.id) ?? 0} achievement(s)</span>
                {p.status === "archived" && <StatusBadge status={p.status} />}
                <ProjectFormDialog
                  project={p}
                  trigger={
                    <Button size="sm" variant="ghost" aria-label="Edit Project">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={p.status === "active" ? "Archive" : "Restore"}
                  onClick={() => updateProject.mutate({ id: p.id, status: p.status === "active" ? "archived" : "active" })}
                >
                  {p.status === "active" ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.data?.length === 0 && (
          <EmptyState title="No Projects yet" description="Add a Project under a Career Role from the Career page or here." />
        )}
      </div>
    </div>
  );
}
