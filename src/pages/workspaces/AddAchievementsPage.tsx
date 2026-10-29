import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { AddAchievementsView } from "@/components/workspace/add-achievements-view";
import { useWorkspace, useWorkspaceCompetencyIds, useWorkspaceItems } from "@/hooks/useWorkspaces";

export function AddAchievementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workspace = useWorkspace(id);
  const items = useWorkspaceItems(id);
  const competencyIds = useWorkspaceCompetencyIds(id);

  const failed = workspace.error ?? items.error ?? competencyIds.error;
  if (failed) throw failed;
  if (!workspace.data || !items.data || !competencyIds.data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  const w = workspace.data;
  const back = () => navigate(`/workspaces/${w.id}`);

  return (
    <div className="space-y-2">
      <PageHeader
        title={`Add Achievements — ${w.name}`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={`/workspaces/${w.id}`}>
              <ArrowLeft className="h-4 w-4" /> Back to Workspace
            </Link>
          </Button>
        }
      />
      <AddAchievementsView
        workspaceId={w.id}
        targetJobTypeId={w.job_type_id}
        targetCompetencyIds={competencyIds.data}
        existingAchievementIds={items.data.map((i) => i.achievement_id)}
        onDone={back}
      />
    </div>
  );
}
