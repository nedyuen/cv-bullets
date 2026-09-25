import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, RotateCcw, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge, MandatoryBadge } from "@/components/common/status-badge";
import { ProjectFormDialog } from "@/components/career/project-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProjects, useProjectAchievementCounts, useUpdateProject } from "@/hooks/useProjects";
import { useAchievements } from "@/hooks/useAchievements";

function ProjectAchievementsList({ projectId, includeArchived }: { projectId: string; includeArchived: boolean }) {
  const achievements = useAchievements({ projectId, includeArchived });

  if (achievements.isLoading) {
    return <p className="text-sm text-muted-foreground px-2 py-1.5">Loading…</p>;
  }
  if ((achievements.data ?? []).length === 0) {
    return <p className="text-sm text-muted-foreground px-2 py-1.5">No Achievements linked yet.</p>;
  }
  return (
    <div className="space-y-1">
      {achievements.data!.map((a) => (
        <Link
          key={a.id}
          to={`/achievements/${a.id}`}
          className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{a.subject}</span>
              {a.mandatory && <MandatoryBadge mandatory={a.mandatory} />}
              {a.status === "archived" && <StatusBadge status={a.status} />}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ProjectsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const projects = useProjects(includeArchived);
  const counts = useProjectAchievementCounts();
  const updateProject = useUpdateProject();

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        {(projects.data ?? []).map((p) => {
          const isOpen = expanded.has(p.id);
          return (
            <Card key={p.id}>
              <CardContent className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 py-2.5">
                {/* Sibling of the actions block, not an ancestor — nesting a portaled
                    Dialog (ProjectFormDialog below) inside this toggle's onClick would
                    re-fire the toggle on every click inside the dialog (React bubbles
                    portaled clicks through the component tree, not the DOM tree). */}
                <div
                  role="button"
                  tabIndex={0}
                  className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer"
                  onClick={() => toggleExpand(p.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleExpand(p.id)}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.career_roles?.title} — {p.career_roles?.companies?.name}
                    </p>
                    {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  </div>
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
              {isOpen && (
                <div className="border-t border-border px-2 py-2">
                  <ProjectAchievementsList projectId={p.id} includeArchived={includeArchived} />
                </div>
              )}
            </Card>
          );
        })}
        {projects.data?.length === 0 && (
          <EmptyState title="No Projects yet" description="Add a Project under a Career Role from the Career page or here." />
        )}
      </div>
    </div>
  );
}
