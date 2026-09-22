import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useJobTypes } from "@/hooks/useSettings";
import { useCreateMasterWording } from "@/hooks/useMasterWordings";
import { Plus } from "lucide-react";

// `open` is controlled by the parent so the trigger button can live in a
// header row while the expanded form renders full-width below it, instead of
// both being forced into the same flex row (which squeezed the form into a
// narrow column next to the heading).
export function AddMasterWordingTrigger({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  if (open) return null;
  return (
    <Button size="sm" variant="outline" onClick={() => onOpenChange(true)}>
      <Plus className="h-4 w-4" /> Add Master Wording
    </Button>
  );
}

export function AddMasterWordingForm({
  achievementId,
  open,
  onOpenChange,
}: {
  achievementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [jobTypeIds, setJobTypeIds] = useState<string[]>([]);
  const jobTypes = useJobTypes();
  const create = useCreateMasterWording();
  const { toast } = useToast();

  if (!open) return null;

  const submit = () => {
    if (!text.trim()) return;
    create.mutate(
      { achievementId, text: text.trim(), jobTypeIds },
      {
        onSuccess: () => {
          onOpenChange(false);
          setText("");
          setJobTypeIds([]);
          toast({ title: "Master Wording added", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't add Master Wording", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="How would you express this Achievement for a target career direction?" />
        <MultiSelect
          options={(jobTypes.data ?? []).map((j) => ({ value: j.id, label: j.name }))}
          selected={jobTypeIds}
          onChange={setJobTypeIds}
          placeholder="Job Types (leave empty for Unclassified)"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={submit} disabled={create.isPending}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
