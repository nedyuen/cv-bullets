import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useJobTypes } from "@/hooks/useSettings";
import { useMasterWordingsForAchievements } from "@/hooks/useMasterWordings";
import { usePromoteApplicationWording } from "@/hooks/useApplicationWordings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowUpCircle } from "lucide-react";

export function PromoteToMasterDialog({ applicationWordingId, achievementIds, text }: { applicationWordingId: string; achievementIds: string[]; text: string }) {
  const [open, setOpen] = useState(false);
  const [achievementId, setAchievementId] = useState<string>(achievementIds[0] ?? "");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [targetMasterWordingId, setTargetMasterWordingId] = useState<string>("");
  const [editableText, setEditableText] = useState(text);
  const [jobTypeIds, setJobTypeIds] = useState<string[]>([]);

  const jobTypes = useJobTypes();
  const promote = usePromoteApplicationWording();
  const { toast } = useToast();

  const achievementsQuery = useQuery({
    queryKey: ["achievements", "byIds", achievementIds],
    enabled: open && achievementIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("id, subject").in("id", achievementIds);
      if (error) throw error;
      return data as Array<{ id: string; subject: string }>;
    },
  });

  const existingMasterWordings = useMasterWordingsForAchievements(achievementId ? [achievementId] : []);

  useEffect(() => {
    if (open) {
      setAchievementId(achievementIds[0] ?? "");
      setMode("new");
      setTargetMasterWordingId("");
      setEditableText(text);
      setJobTypeIds([]);
    }
  }, [open, achievementIds, text]);

  const submit = () => {
    if (!achievementId || !editableText.trim()) return;
    promote.mutate(
      {
        achievementId,
        text: editableText.trim(),
        jobTypeIds,
        targetMasterWordingId: mode === "existing" ? targetMasterWordingId || null : null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Promoted to Master Wording", description: "The original Application Wording is unchanged.", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't promote", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowUpCircle className="h-4 w-4" /> Promote to Master
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Promote to Master Wording</DialogTitle>
          <DialogDescription>
            The original Application Wording is never changed by promotion — this creates or updates a reusable Master Wording.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {achievementIds.length > 1 ? (
            <div className="space-y-1.5">
              <Label>
                This wording links {achievementIds.length} Achievements — choose which one this reusable Master Wording belongs to
              </Label>
              <Select value={achievementId} onValueChange={setAchievementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an Achievement" />
                </SelectTrigger>
                <SelectContent>
                  {(achievementsQuery.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                It will not automatically become Master Wording for the other {achievementIds.length - 1} Achievement(s).
              </p>
            </div>
          ) : (
            <p className="text-sm">
              For Achievement: <span className="font-medium">{achievementsQuery.data?.[0]?.subject}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="promote-wording-text">Wording</Label>
            <Textarea id="promote-wording-text" value={editableText} onChange={(e) => setEditableText(e.target.value)} rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Job Type(s) for this Master Wording</Label>
            <MultiSelect
              options={(jobTypes.data ?? []).map((j) => ({ value: j.id, label: j.name }))}
              selected={jobTypeIds}
              onChange={setJobTypeIds}
              placeholder="Choose explicitly — not auto-filled from the application"
            />
          </div>

          {(existingMasterWordings.data?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "new" | "existing")}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id="mode-new" />
                  <Label htmlFor="mode-new" className="font-normal">Create a new Master Wording</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="existing" id="mode-existing" />
                  <Label htmlFor="mode-existing" className="font-normal">Add as a new version of an existing Master Wording</Label>
                </div>
              </RadioGroup>
              {mode === "existing" && (
                <Select value={targetMasterWordingId} onValueChange={setTargetMasterWordingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing Master Wording" />
                  </SelectTrigger>
                  <SelectContent>
                    {(existingMasterWordings.data ?? []).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.jobTypeIds.length ? w.jobTypeIds.map((id) => jobTypes.data?.find((j) => j.id === id)?.name).join(", ") : "Unclassified"}
                        {" — "}
                        {w.currentVersion?.text.slice(0, 40)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={promote.isPending || (mode === "existing" && !targetMasterWordingId)}>
            Promote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
