import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCareerRoles } from "@/hooks/useCareerRoles";
import { useCreateProject } from "@/hooks/useProjects";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

export function ProjectFormDialog({ defaultCareerRoleId }: { defaultCareerRoleId?: string }) {
  const [open, setOpen] = useState(false);
  const [careerRoleId, setCareerRoleId] = useState(defaultCareerRoleId ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const careerRoles = useCareerRoles();
  const create = useCreateProject();
  const { toast } = useToast();

  const reset = () => {
    setCareerRoleId(defaultCareerRoleId ?? "");
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  const submit = () => {
    if (!careerRoleId || !name.trim()) return;
    create.mutate(
      {
        career_role_id: careerRoleId,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          toast({ title: "Project added", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't add Project", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Career Role</Label>
            <Select value={careerRoleId} onValueChange={setCareerRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a career role" />
              </SelectTrigger>
              <SelectContent>
                {(careerRoles.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title} — {r.companies?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Enterprise AI Transformation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project-start">Start Date</Label>
              <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-end">End Date</Label>
              <Input id="project-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
