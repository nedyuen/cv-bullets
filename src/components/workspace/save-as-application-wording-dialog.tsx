import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useJobApplications } from "@/hooks/useJobApplications";
import { useCreateApplicationWording } from "@/hooks/useApplicationWordings";
import type { WorkspaceItemWithAchievement } from "@/hooks/useWorkspaces";
import { Save } from "lucide-react";

export function SaveAsApplicationWordingDialog({
  item,
  defaultJobApplicationId,
}: {
  item: WorkspaceItemWithAchievement;
  defaultJobApplicationId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [jobApplicationId, setJobApplicationId] = useState<string>(defaultJobApplicationId ?? "");
  const [achievementIds, setAchievementIds] = useState<string[]>([item.achievement_id]);
  const [text, setText] = useState(item.snapshot_text);

  const applications = useJobApplications();
  const achievements = useAchievements({});
  const create = useCreateApplicationWording();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setJobApplicationId(defaultJobApplicationId ?? "");
      setAchievementIds([item.achievement_id]);
      setText(item.snapshot_text);
    }
  }, [open, defaultJobApplicationId, item.achievement_id, item.snapshot_text]);

  const submit = () => {
    if (!jobApplicationId || !text.trim() || achievementIds.length === 0) return;
    create.mutate(
      {
        jobApplicationId,
        text: text.trim(),
        achievementIds,
        sourceMasterWordingId: item.selected_master_wording_id,
        sourceMasterWordingVersionId: item.selected_master_wording_version_id,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Saved as Application Wording", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Save className="h-3.5 w-3.5" /> Save as Application Wording
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Application Wording</DialogTitle>
          <DialogDescription>
            Records the exact wording used for a specific Job Application. Select more Achievements below if this bullet merges several.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Job Application</Label>
            <Select value={jobApplicationId} onValueChange={setJobApplicationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Job Application" />
              </SelectTrigger>
              <SelectContent>
                {(applications.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.companies?.name} — {a.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Achievement(s)</Label>
            <MultiSelect
              options={(achievements.data ?? []).map((a) => ({ value: a.id, label: a.subject }))}
              selected={achievementIds}
              onChange={setAchievementIds}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-as-application-wording-text">Final tailored wording</Label>
            <Textarea id="save-as-application-wording-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} />
          </div>
          {item.selected_master_wording_id && (
            <p className="text-xs text-muted-foreground">Source Master Wording and exact version will be recorded automatically.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
