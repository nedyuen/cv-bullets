import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useAchievementClassification, useQuickEditAchievement } from "@/hooks/useAchievements";
import { useCompetencies } from "@/hooks/useSettings";
import type { Achievement } from "@/types/database";

// Quick edit of an Achievement's Notes and Competencies without leaving the
// Workspace. Drafts are null until touched, so the fields track saved data.
export function AchievementQuickEdit({ achievement }: { achievement: Achievement }) {
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [competencyDraft, setCompetencyDraft] = useState<string[] | null>(null);
  const classification = useAchievementClassification(achievement.id);
  const competencies = useCompetencies();
  const save = useQuickEditAchievement();
  const { toast } = useToast();

  const notes = notesDraft ?? achievement.notes ?? "";
  const competencyIds = competencyDraft ?? classification.data?.competencyIds ?? [];
  const dirty = notesDraft !== null || competencyDraft !== null;

  const submit = () =>
    save.mutate(
      { id: achievement.id, notes: notes.trim() ? notes : null, competencyIds },
      {
        onSuccess: () => {
          setNotesDraft(null);
          setCompetencyDraft(null);
          toast({ title: "Achievement updated", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotesDraft(e.target.value)} rows={4} placeholder="Anything worth remembering about this Achievement..." />
      </div>
      <div className="space-y-1.5">
        <Label>Competencies</Label>
        <MultiSelect
          options={(competencies.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          selected={competencyIds}
          onChange={setCompetencyDraft}
          placeholder="Select Competencies"
        />
      </div>
      <Button size="sm" onClick={submit} disabled={!dirty || save.isPending || classification.isLoading}>
        <Save className="h-3.5 w-3.5" /> Save
      </Button>
    </div>
  );
}
