import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useCreateApplicationWording } from "@/hooks/useApplicationWordings";
import { Plus } from "lucide-react";

// Manual "created from scratch" path (spec §20) — no Master Wording provenance.
export function AddApplicationWordingDialog({ jobApplicationId }: { jobApplicationId: string }) {
  const [open, setOpen] = useState(false);
  const [achievementIds, setAchievementIds] = useState<string[]>([]);
  const [text, setText] = useState("");

  const achievements = useAchievements({});
  const create = useCreateApplicationWording();
  const { toast } = useToast();

  const submit = () => {
    if (!text.trim() || achievementIds.length === 0) return;
    create.mutate(
      { jobApplicationId, text: text.trim(), achievementIds },
      {
        onSuccess: () => {
          setOpen(false);
          setAchievementIds([]);
          setText("");
          toast({ title: "Application Wording saved", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Add Wording (from scratch)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Application Wording</DialogTitle>
          <DialogDescription>
            Written directly for this application, not derived from a Master Wording. Select one Achievement, or several for a merged bullet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Achievement(s)</Label>
            <MultiSelect
              options={(achievements.data ?? []).map((a) => ({ value: a.id, label: a.subject }))}
              selected={achievementIds}
              onChange={setAchievementIds}
              placeholder="Select one or more Achievements"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-application-wording-text">Wording</Label>
            <Textarea id="new-application-wording-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Exact wording used for this application." />
          </div>
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
