import { useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
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
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.career_roles?.title} — {p.career_roles?.companies?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{counts.data?.get(p.id) ?? 0} achievement(s)</span>
                <StatusBadge status={p.status} />
                <Button size="sm" variant="ghost" onClick={() => updateProject.mutate({ id: p.id, status: p.status === "active" ? "archived" : "active" })}>
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
