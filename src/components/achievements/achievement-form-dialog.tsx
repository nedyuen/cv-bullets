import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useJobTypes, useCompetencies, useTags, useCreateTag } from "@/hooks/useSettings";
import { useProjects } from "@/hooks/useProjects";
import {
  useCreateAchievement,
  useUpdateAchievement,
  useAchievementClassification,
  type AchievementInput,
} from "@/hooks/useAchievements";
import { useMasterWordingsForAchievement } from "@/hooks/useMasterWordings";
import { AddMasterWordingForm, AddMasterWordingTrigger } from "@/components/achievements/add-master-wording-form";
import { MasterWordingCard } from "@/components/achievements/master-wording-card";
import type { Achievement } from "@/types/database";
import { Plus, Pencil } from "lucide-react";

interface AchievementFormDialogProps {
  achievement?: Achievement; // when present, edits in place
  trigger?: React.ReactNode;
}

export function AchievementFormDialog({ achievement, trigger }: AchievementFormDialogProps) {
  const isEdit = !!achievement;
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [significance, setSignificance] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [jobTypeIds, setJobTypeIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [addWordingOpen, setAddWordingOpen] = useState(false);

  const jobTypes = useJobTypes();
  const competencies = useCompetencies();
  const tags = useTags();
  const projects = useProjects();
  const createTag = useCreateTag();
  const classification = useAchievementClassification(isEdit ? achievement!.id : undefined);
  const masterWordings = useMasterWordingsForAchievement(isEdit ? achievement!.id : undefined, true);

  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();

  useEffect(() => {
    if (!open) return;
    setAddWordingOpen(false);
    if (isEdit && achievement) {
      setSubject(achievement.subject);
      setDescription(achievement.description ?? "");
      setSignificance(achievement.significance_impact ?? "");
      setFeedback(achievement.feedback ?? "");
      setMandatory(achievement.mandatory);
    } else {
      setSubject("");
      setDescription("");
      setSignificance("");
      setFeedback("");
      setMandatory(false);
      setCompetencyIds([]);
      setJobTypeIds([]);
      setTagIds([]);
      setProjectIds([]);
    }
  }, [open, isEdit, achievement]);

  useEffect(() => {
    if (isEdit && classification.data) {
      setCompetencyIds(classification.data.competencyIds);
      setJobTypeIds(classification.data.jobTypeIds);
      setTagIds(classification.data.tagIds);
      setProjectIds(classification.data.projectIds);
    }
  }, [isEdit, classification.data]);

  const submit = async () => {
    if (!subject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    const input: AchievementInput = {
      subject: subject.trim(),
      description: description.trim() || null,
      significance_impact: significance.trim() || null,
      feedback: feedback.trim() || null,
      mandatory,
      competencyIds,
      jobTypeIds,
      tagIds,
      projectIds,
    };

    const onSuccess = () => {
      setOpen(false);
      toast({ title: isEdit ? "Achievement updated" : "Achievement created", variant: "success" });
    };
    const onError = (e: Error) => toast({ title: "Couldn't save Achievement", description: e.message, variant: "destructive" });

    if (isEdit) {
      updateAchievement.mutate({ id: achievement!.id, ...input }, { onSuccess, onError });
    } else {
      createAchievement.mutate(input, { onSuccess, onError });
    }
  };

  const isPending = createAchievement.isPending || updateAchievement.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit" : "New Achievement"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Achievement" : "New Achievement"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="wordings">Master Wordings{isEdit ? ` (${masterWordings.data?.length ?? 0})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="achievement-subject">Subject</Label>
                <Input id="achievement-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Enterprise AI Transformation" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="achievement-description">Description</Label>
                <Textarea id="achievement-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Factual explanation of the achievement." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="achievement-significance">Significance &amp; Impact</Label>
                <Textarea
                  id="achievement-significance"
                  value={significance}
                  onChange={(e) => setSignificance(e.target.value)}
                  rows={3}
                  placeholder="Why is this impressive/significant — scale, financial impact, seniority, novelty..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="achievement-feedback">Feedback</Label>
                <Textarea id="achievement-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} placeholder="Stakeholder feedback, praise, interview notes..." />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="mandatory" checked={mandatory} onCheckedChange={(v) => setMandatory(v === true)} />
                <Label htmlFor="mandatory">Mandatory (essential — not droppable when space is constrained)</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Competencies</Label>
                  <MultiSelect
                    options={(competencies.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    selected={competencyIds}
                    onChange={setCompetencyIds}
                    placeholder="Select Competencies"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Direct Job Types</Label>
                  <MultiSelect
                    options={(jobTypes.data ?? []).map((j) => ({ value: j.id, label: j.name }))}
                    selected={jobTypeIds}
                    onChange={setJobTypeIds}
                    placeholder="Select Job Types"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <MultiSelect
                    options={(tags.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
                    selected={tagIds}
                    onChange={setTagIds}
                    placeholder="Select or create Tags"
                    creatable
                    onCreate={async (label) => {
                      const tag = await createTag.mutateAsync(label);
                      setTagIds((prev) => [...prev, tag.id]);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Projects</Label>
                  <MultiSelect
                    options={(projects.data ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.career_roles?.title ?? ""})` }))}
                    selected={projectIds}
                    onChange={setProjectIds}
                    placeholder="Select Projects"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wordings">
            {!isEdit ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Save this Achievement first, then reopen Edit to add Master Wordings.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <AddMasterWordingTrigger open={addWordingOpen} onOpenChange={setAddWordingOpen} />
                </div>
                {addWordingOpen && (
                  <AddMasterWordingForm achievementId={achievement!.id} open={addWordingOpen} onOpenChange={setAddWordingOpen} />
                )}
                <div className="space-y-3">
                  {(masterWordings.data ?? []).map((w) => (
                    <MasterWordingCard key={w.id} wording={w} />
                  ))}
                  {masterWordings.data?.length === 0 && !addWordingOpen && (
                    <p className="text-sm text-muted-foreground">No Master Wordings yet.</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isEdit ? "Save Changes" : "Create Achievement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
