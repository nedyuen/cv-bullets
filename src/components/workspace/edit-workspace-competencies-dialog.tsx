import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useCompetencies } from "@/hooks/useSettings";
import { useSetWorkspaceCompetencies } from "@/hooks/useWorkspaces";

interface EditWorkspaceCompetenciesDialogProps {
  workspaceId: string;
  competencyIds: string[];
}

export function EditWorkspaceCompetenciesDialog({ workspaceId, competencyIds }: EditWorkspaceCompetenciesDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(competencyIds);
  const competencies = useCompetencies();
  const save = useSetWorkspaceCompetencies();
  const { toast } = useToast();

  const submit = () =>
    save.mutate(
      { workspaceId, competencyIds: selected },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Competencies updated", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't update Competencies", description: e.message, variant: "destructive" }),
      },
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelected(competencyIds);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-3.5 w-3.5" /> Competencies
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Target Competencies</DialogTitle>
        </DialogHeader>
        <MultiSelect
          options={(competencies.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          selected={selected}
          onChange={setSelected}
          placeholder="Select Competencies"
        />
        <p className="text-xs text-muted-foreground">Already-added Achievements are not affected; this only changes future recommendations.</p>
        <DialogFooter>
          <Button onClick={submit} disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
