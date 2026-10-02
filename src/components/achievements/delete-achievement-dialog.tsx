import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDeleteAchievement } from "@/hooks/useAchievements";
import { useApplicationWordingsForAchievement } from "@/hooks/useApplicationWordings";
import { useWorkspaceUsageForAchievement } from "@/hooks/useWorkspaces";
import { useUsedAsComponentIn } from "@/hooks/useCompoundAchievements";
import { useMasterWordingsForAchievement } from "@/hooks/useMasterWordings";

export function DeleteAchievementDialog({ achievementId, subject }: { achievementId: string; subject: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // All four gated on `open` so these never fire for rows the user hasn't
  // opened the dialog for — same `enabled: !!id` convention every hook here
  // already uses.
  const applicationWordings = useApplicationWordingsForAchievement(open ? achievementId : undefined);
  const workspaceUsage = useWorkspaceUsageForAchievement(open ? achievementId : undefined);
  const usedAsComponentIn = useUsedAsComponentIn(open ? achievementId : undefined);
  const masterWordings = useMasterWordingsForAchievement(open ? achievementId : undefined, true);

  const deleteAchievement = useDeleteAchievement();

  const isLoading =
    applicationWordings.isLoading || workspaceUsage.isLoading || usedAsComponentIn.isLoading || masterWordings.isLoading;

  const blockers = [
    ...(applicationWordings.data ?? []).map((w) => ({
      key: `app-${w.id}`,
      label: w.jobApplication ? `${w.jobApplication.company_name} — ${w.jobApplication.job_title}` : "an Application",
      to: w.jobApplication ? `/applications/${w.jobApplication.id}` : undefined,
      kind: "Application Wording",
    })),
    ...(workspaceUsage.data ?? []).map((u) => ({
      key: `ws-${u.id}`,
      label: u.cv_workspaces?.name ?? "a Workspace",
      to: u.workspace_id ? `/workspaces/${u.workspace_id}` : undefined,
      kind: "CV Workspace",
    })),
    ...(usedAsComponentIn.data ?? []).map((c) => ({
      key: `comp-${c.id}`,
      label: c.subject,
      to: `/achievements/${c.id}`,
      kind: "Compound Achievement",
    })),
  ];

  const canDelete = !isLoading && blockers.length === 0;

  const handleDelete = () => {
    deleteAchievement.mutate(achievementId, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Achievement deleted", variant: "success" });
      },
      onError: (e) => toast({ title: "Couldn't delete Achievement", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{subject}"?</DialogTitle>
          {!isLoading && (
            <DialogDescription>
              {blockers.length > 0
                ? "This Achievement can't be deleted yet — it's still in use."
                : "This permanently deletes the Achievement. This cannot be undone."}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking usage…
          </div>
        )}

        {!isLoading && blockers.length > 0 && (
          <div className="space-y-2 text-sm">
            {applicationWordings.data!.length > 0 && (
              <p className="text-muted-foreground">
                Used in {applicationWordings.data!.length} Application Wording{applicationWordings.data!.length > 1 ? "s" : ""} — remove or
                reassign those first.
              </p>
            )}
            {workspaceUsage.data!.length > 0 && (
              <p className="text-muted-foreground">
                Used in {workspaceUsage.data!.length} CV Workspace{workspaceUsage.data!.length > 1 ? "s" : ""} — remove it from{" "}
                {workspaceUsage.data!.length > 1 ? "those" : "that"} first.
              </p>
            )}
            {usedAsComponentIn.data!.length > 0 && (
              <p className="text-muted-foreground">
                It's a component of {usedAsComponentIn.data!.length} Compound Achievement{usedAsComponentIn.data!.length > 1 ? "s" : ""} —
                remove it from {usedAsComponentIn.data!.length > 1 ? "their" : "its"} components first (Edit Components on that Achievement),
                otherwise deleting this would silently break {usedAsComponentIn.data!.length > 1 ? "their" : "its"} composition.
              </p>
            )}
            <div className="rounded-md border border-border divide-y divide-border">
              {blockers.map((b) => (
                <div key={b.key} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">{b.kind}</span>
                  {b.to ? (
                    <Link to={b.to} className="text-sm hover:underline" onClick={() => setOpen(false)}>
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-sm">{b.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && blockers.length === 0 && (masterWordings.data?.length ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            This will also permanently delete {masterWordings.data!.length} Master Wording{masterWordings.data!.length > 1 ? "s" : ""} and
            all of {masterWordings.data!.length > 1 ? "their" : "its"} version history.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {canDelete ? "Cancel" : "Close"}
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAchievement.isPending}>
              Delete Achievement
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
