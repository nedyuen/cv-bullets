import { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { MandatoryBadge } from "@/components/common/status-badge";
import { useToast } from "@/components/ui/toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useMasterWordingsForAchievement, type MasterWordingWithDetail } from "@/hooks/useMasterWordings";
import { useApplicationWordingsForAchievement } from "@/hooks/useApplicationWordings";
import { useAddWorkspaceItem } from "@/hooks/useWorkspaces";
import { useJobTypes } from "@/hooks/useSettings";
import { Plus } from "lucide-react";

interface AddAchievementDialogProps {
  workspaceId: string;
  targetJobTypeId: string | null;
  existingAchievementIds: string[];
}

type WordingChoice =
  | { kind: "master"; wording: MasterWordingWithDetail }
  | { kind: "application"; text: string }
  | { kind: "custom" };

export function AddAchievementDialog({ workspaceId, targetJobTypeId, existingAchievementIds }: AddAchievementDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [choice, setChoice] = useState<WordingChoice | null>(null);
  const [customText, setCustomText] = useState("");
  const [autoApplied, setAutoApplied] = useState(false);

  const jobTypes = useJobTypes();
  const achievements = useAchievements({ search, includeArchived: false });
  const candidates = useMemo(
    () => (achievements.data ?? []).filter((a) => !existingAchievementIds.includes(a.id)),
    [achievements.data, existingAchievementIds],
  );

  const masterWordings = useMasterWordingsForAchievement(selectedAchievementId ?? undefined);
  const applicationWordings = useApplicationWordingsForAchievement(selectedAchievementId ?? undefined);
  const addItem = useAddWorkspaceItem();
  const { toast } = useToast();

  const jobTypeTagged = (masterWordings.data ?? []).filter((w) => targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId));
  const unclassified = (masterWordings.data ?? []).filter((w) => w.jobTypeIds.length === 0);
  const otherJobType = (masterWordings.data ?? []).filter(
    (w) => w.jobTypeIds.length > 0 && !(targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId)),
  );

  // Auto-select when exactly one Master Wording is tagged for the target Job Type (spec §31).
  useEffect(() => {
    if (!selectedAchievementId || autoApplied || masterWordings.isLoading) return;
    if (targetJobTypeId && jobTypeTagged.length === 1) {
      setChoice({ kind: "master", wording: jobTypeTagged[0] });
      setAutoApplied(true);
    }
  }, [selectedAchievementId, targetJobTypeId, jobTypeTagged.length, masterWordings.isLoading, autoApplied]);

  const reset = () => {
    setSelectedAchievementId(null);
    setChoice(null);
    setCustomText("");
    setAutoApplied(false);
    setSearch("");
  };

  const confirm = () => {
    if (!selectedAchievementId) return;
    let snapshotText = "";
    let selectedMasterWordingId: string | null = null;
    let selectedMasterWordingVersionId: string | null = null;

    if (choice?.kind === "master") {
      snapshotText = choice.wording.currentVersion?.text ?? "";
      selectedMasterWordingId = choice.wording.id;
      selectedMasterWordingVersionId = choice.wording.currentVersion?.id ?? null;
    } else if (choice?.kind === "application") {
      snapshotText = choice.text;
    } else {
      snapshotText = customText;
    }

    if (!snapshotText.trim()) {
      toast({ title: "Choose or write wording first", variant: "destructive" });
      return;
    }

    addItem.mutate(
      { workspaceId, achievementId: selectedAchievementId, snapshotText: snapshotText.trim(), selectedMasterWordingId, selectedMasterWordingVersionId },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          toast({ title: "Added to Workspace", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't add", description: e.message, variant: "destructive" }),
      },
    );
  };

  const needsManualPick = selectedAchievementId && !(targetJobTypeId && jobTypeTagged.length === 1);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add Achievement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedAchievementId ? "Choose wording" : "Add Achievement to Workspace"}</DialogTitle>
          {selectedAchievementId && needsManualPick && (
            <DialogDescription>
              {targetJobTypeId
                ? "More than one option is available for this Job Type — choose which wording to use."
                : "This Workspace has no target Job Type set — choose which wording to use."}
            </DialogDescription>
          )}
        </DialogHeader>

        {!selectedAchievementId ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search Achievements..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {candidates.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:border-primary/50" onClick={() => setSelectedAchievementId(a.id)}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.subject}</p>
                      {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
                    </div>
                    <MandatoryBadge mandatory={a.mandatory} />
                  </CardContent>
                </Card>
              ))}
              {candidates.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No matching Achievements.</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedAchievementId(null); setChoice(null); setAutoApplied(false); }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to search
            </Button>

            {choice?.kind === "master" && autoApplied && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm">
                Auto-selected the single Master Wording tagged for this Job Type. You can pick a different option below.
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {jobTypeTagged.length > 0 && (
                <WordingGroup title={`Master Wordings for ${jobTypes.data?.find((j) => j.id === targetJobTypeId)?.name ?? "target Job Type"}`}>
                  {jobTypeTagged.map((w) => (
                    <WordingOption
                      key={w.id}
                      selected={choice?.kind === "master" && choice.wording.id === w.id}
                      text={w.currentVersion?.text ?? ""}
                      onSelect={() => setChoice({ kind: "master", wording: w })}
                    />
                  ))}
                </WordingGroup>
              )}
              {unclassified.length > 0 && (
                <WordingGroup title="Unclassified Master Wordings">
                  {unclassified.map((w) => (
                    <WordingOption
                      key={w.id}
                      selected={choice?.kind === "master" && choice.wording.id === w.id}
                      text={w.currentVersion?.text ?? ""}
                      onSelect={() => setChoice({ kind: "master", wording: w })}
                    />
                  ))}
                </WordingGroup>
              )}
              {otherJobType.length > 0 && (
                <WordingGroup title="Master Wordings for other Job Types">
                  {otherJobType.map((w) => (
                    <WordingOption
                      key={w.id}
                      selected={choice?.kind === "master" && choice.wording.id === w.id}
                      text={w.currentVersion?.text ?? ""}
                      badge={w.jobTypeIds.map((id) => jobTypes.data?.find((j) => j.id === id)?.name).join(", ")}
                      onSelect={() => setChoice({ kind: "master", wording: w })}
                    />
                  ))}
                </WordingGroup>
              )}
              {(applicationWordings.data?.length ?? 0) > 0 && (
                <WordingGroup title="Prior Application Wordings (inspiration)">
                  {applicationWordings.data!.map((w) => (
                    <WordingOption
                      key={w.id}
                      selected={choice?.kind === "application" && choice.text === w.currentVersion?.text}
                      text={w.currentVersion?.text ?? ""}
                      badge={w.jobApplication ? `${w.jobApplication.companies?.name} — ${w.jobApplication.job_title}` : undefined}
                      onSelect={() => setChoice({ kind: "application", text: w.currentVersion?.text ?? "" })}
                    />
                  ))}
                </WordingGroup>
              )}
              <WordingGroup title="Write custom text for this Workspace">
                <div
                  className={`rounded-md border p-2 ${choice?.kind === "custom" ? "border-primary" : ""}`}
                  onClick={() => setChoice({ kind: "custom" })}
                >
                  <Textarea
                    value={customText}
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      setChoice({ kind: "custom" });
                    }}
                    rows={2}
                    placeholder="Write wording directly for this Workspace..."
                  />
                </div>
              </WordingGroup>
            </div>
          </div>
        )}

        {selectedAchievementId && (
          <DialogFooter>
            <Button onClick={confirm} disabled={addItem.isPending || !choice}>
              Add to Workspace
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WordingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function WordingOption({ text, badge, selected, onSelect }: { text: string; badge?: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={`w-full text-left rounded-md border p-2.5 text-sm transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
      onClick={onSelect}
    >
      {badge && (
        <Badge variant="outline" className="mb-1">
          {badge}
        </Badge>
      )}
      <p>{text}</p>
    </button>
  );
}
