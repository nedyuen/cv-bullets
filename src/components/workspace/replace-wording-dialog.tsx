import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useMasterWordingsForAchievement } from "@/hooks/useMasterWordings";
import { useJobTypes } from "@/hooks/useSettings";
import { useReplaceWorkspaceItemWording } from "@/hooks/useWorkspaces";
import { WordingGroup, WordingOption } from "@/components/workspace/add-achievement-dialog";
import { RefreshCw } from "lucide-react";

export function ReplaceWordingDialog({
  itemId,
  workspaceId,
  achievementId,
  targetJobTypeId,
}: {
  itemId: string;
  workspaceId: string;
  achievementId: string;
  targetJobTypeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [selectedWordingId, setSelectedWordingId] = useState<string | null>(null);

  const masterWordings = useMasterWordingsForAchievement(open ? achievementId : undefined);
  const jobTypes = useJobTypes();
  const replace = useReplaceWorkspaceItemWording();
  const { toast } = useToast();

  const jobTypeTagged = (masterWordings.data ?? []).filter((w) => targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId));
  const unclassified = (masterWordings.data ?? []).filter((w) => w.jobTypeIds.length === 0);
  const otherJobType = (masterWordings.data ?? []).filter(
    (w) => w.jobTypeIds.length > 0 && !(targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId)),
  );
  const allWordings = masterWordings.data ?? [];

  const confirm = () => {
    const wording = allWordings.find((w) => w.id === selectedWordingId);
    if (!wording?.currentVersion) return;
    replace.mutate(
      {
        id: itemId,
        workspaceId,
        snapshotText: wording.currentVersion.text,
        selectedMasterWordingId: wording.id,
        selectedMasterWordingVersionId: wording.currentVersion.id,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Workspace wording replaced", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't replace", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <RefreshCw className="h-3.5 w-3.5" /> Replace wording
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pick a different source wording</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {jobTypeTagged.length > 0 && (
            <WordingGroup title="Tagged for this Workspace's Job Type">
              {jobTypeTagged.map((w) => (
                <WordingOption key={w.id} selected={selectedWordingId === w.id} text={w.currentVersion?.text ?? ""} onSelect={() => setSelectedWordingId(w.id)} />
              ))}
            </WordingGroup>
          )}
          {unclassified.length > 0 && (
            <WordingGroup title="Unclassified">
              {unclassified.map((w) => (
                <WordingOption key={w.id} selected={selectedWordingId === w.id} text={w.currentVersion?.text ?? ""} onSelect={() => setSelectedWordingId(w.id)} />
              ))}
            </WordingGroup>
          )}
          {otherJobType.length > 0 && (
            <WordingGroup title="Other Job Types">
              {otherJobType.map((w) => (
                <WordingOption
                  key={w.id}
                  selected={selectedWordingId === w.id}
                  text={w.currentVersion?.text ?? ""}
                  badge={w.jobTypeIds.map((id) => jobTypes.data?.find((j) => j.id === id)?.name).join(", ")}
                  onSelect={() => setSelectedWordingId(w.id)}
                />
              ))}
            </WordingGroup>
          )}
          {allWordings.length === 0 && <p className="text-sm text-muted-foreground">No Master Wordings exist for this Achievement yet.</p>}
        </div>
        <DialogFooter>
          <Button onClick={confirm} disabled={!selectedWordingId || replace.isPending}>
            Use this wording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
