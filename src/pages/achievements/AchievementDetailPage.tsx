import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, MandatoryBadge } from "@/components/common/status-badge";
import { JobTypeBadges } from "@/components/achievements/job-type-badges";
import { AchievementFormDialog } from "@/components/achievements/achievement-form-dialog";
import { AddMasterWordingForm, AddMasterWordingTrigger } from "@/components/achievements/add-master-wording-form";
import { MasterWordingCard } from "@/components/achievements/master-wording-card";
import { ApplicationWordingCard } from "@/components/applications/application-wording-card";
import { CompoundRelationshipsCard } from "@/components/achievements/compound-relationships-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAchievement, useAchievementClassification, useSetAchievementStatus } from "@/hooks/useAchievements";
import { useMasterWordingsForAchievement } from "@/hooks/useMasterWordings";
import { useApplicationWordingsForAchievement } from "@/hooks/useApplicationWordings";
import { useWorkspaceUsageForAchievement } from "@/hooks/useWorkspaces";
import { useRelevantJobTypesMap } from "@/hooks/useRelevantJobTypes";
import { useJobTypes, useCompetencies, useTags } from "@/hooks/useSettings";
import { useProject } from "@/hooks/useProjects";
import { Archive, RotateCcw } from "lucide-react";

function ProjectContextRow({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  if (!project.data) return null;
  return (
    <div className="text-sm">
      <span className="font-medium">{project.data.name}</span>
      <span className="text-muted-foreground">
        {" "}
        — {project.data.career_roles?.title} at {project.data.career_roles?.companies?.name}
      </span>
    </div>
  );
}

export function AchievementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [addWordingOpen, setAddWordingOpen] = useState(false);

  const achievement = useAchievement(id);
  const classification = useAchievementClassification(id);
  const masterWordings = useMasterWordingsForAchievement(id, true);
  const applicationWordings = useApplicationWordingsForAchievement(id);
  const workspaceUsage = useWorkspaceUsageForAchievement(id);
  const relevantJobTypes = useRelevantJobTypesMap(id ? [id] : []);
  const setStatus = useSetAchievementStatus();

  const jobTypes = useJobTypes(true);
  const competencies = useCompetencies(true);
  const tags = useTags();
  const jobTypesById = useMemo(() => new Map((jobTypes.data ?? []).map((j) => [j.id, j])), [jobTypes.data]);

  if (!achievement.data) return null;
  const a = achievement.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={a.subject}
        description={`ID: ${a.id}`}
        actions={
          <div className="flex items-center gap-2">
            <AchievementFormDialog achievement={a} />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setStatus.mutate(
                  { id: a.id, status: a.status === "active" ? "archived" : "active" },
                  { onSuccess: () => toast({ title: a.status === "active" ? "Archived" : "Restored", variant: "success" }) },
                )
              }
            >
              {a.status === "active" ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              {a.status === "active" ? "Archive" : "Restore"}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <MandatoryBadge mandatory={a.mandatory} />
        <StatusBadge status={a.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Career Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {(classification.data?.projectIds ?? []).map((pid) => (
            <ProjectContextRow key={pid} projectId={pid} />
          ))}
          {classification.data?.projectIds.length === 0 && <p className="text-sm text-muted-foreground">No Projects linked.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{a.description || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Significance &amp; Impact</p>
            <p className="text-sm">{a.significance_impact || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
            <p className="text-sm">{a.feedback || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Competencies</p>
            <div className="flex flex-wrap gap-1">
              {(classification.data?.competencyIds ?? []).map((cid) => (
                <Badge key={cid} variant="secondary">
                  {competencies.data?.find((c) => c.id === cid)?.name ?? cid}
                </Badge>
              ))}
              {classification.data?.competencyIds.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Job Types (direct + inherited)</p>
            <JobTypeBadges relevant={relevantJobTypes.data?.get(a.id)} jobTypesById={jobTypesById} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {(classification.data?.tagIds ?? []).map((tid) => (
                <Badge key={tid} variant="outline">
                  {tags.data?.find((t) => t.id === tid)?.name ?? tid}
                </Badge>
              ))}
              {classification.data?.tagIds.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Master Wordings</h2>
          <AddMasterWordingTrigger open={addWordingOpen} onOpenChange={setAddWordingOpen} />
        </div>
        {addWordingOpen && (
          <div className="mb-3">
            <AddMasterWordingForm achievementId={a.id} open={addWordingOpen} onOpenChange={setAddWordingOpen} />
          </div>
        )}
        <div className="space-y-3">
          {(masterWordings.data ?? []).map((w) => (
            <MasterWordingCard key={w.id} wording={w} />
          ))}
          {masterWordings.data?.length === 0 && <p className="text-sm text-muted-foreground">No Master Wordings yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Application Wordings</h2>
        <div className="space-y-3">
          {(applicationWordings.data ?? []).map((w) => (
            <ApplicationWordingCard key={w.id} wording={w} />
          ))}
          {applicationWordings.data?.length === 0 && <p className="text-sm text-muted-foreground">Not used in any Application yet.</p>}
        </div>
      </div>

      <CompoundRelationshipsCard achievementId={a.id} />

      <Card>
        <CardHeader>
          <CardTitle>Usage in Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(workspaceUsage.data ?? []).map((u) => (
              <Link key={u.id} to={`/workspaces/${u.workspace_id}`}>
                <Badge variant="secondary">{u.cv_workspaces?.name}</Badge>
              </Link>
            ))}
            {workspaceUsage.data?.length === 0 && <span className="text-sm text-muted-foreground">Not used in any Workspace yet.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
