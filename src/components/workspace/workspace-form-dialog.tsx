import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useJobTypes } from "@/hooks/useSettings";
import { useJobApplications } from "@/hooks/useJobApplications";
import { useCreateWorkspace } from "@/hooks/useWorkspaces";
import { Plus } from "lucide-react";

const NONE = "__none__";

export function WorkspaceFormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [jobTypeId, setJobTypeId] = useState<string>(NONE);
  const [jobApplicationId, setJobApplicationId] = useState<string>(NONE);

  const jobTypes = useJobTypes();
  const applications = useJobApplications();
  const create = useCreateWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = () => {
    if (!name.trim()) return;
    create.mutate(
      {
        name: name.trim(),
        job_type_id: jobTypeId === NONE ? null : jobTypeId,
        job_application_id: jobApplicationId === NONE ? null : jobApplicationId,
      },
      {
        onSuccess: (workspace) => {
          setOpen(false);
          toast({ title: "Workspace created", variant: "success" });
          navigate(`/workspaces/${workspace.id}`);
        },
        onError: (e) => toast({ title: "Couldn't create Workspace", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New CV Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="workspace-name">Name</Label>
            <Input id="workspace-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI Transformation CV — September 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Target Job Type</Label>
            <Select value={jobTypeId} onValueChange={setJobTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {(jobTypes.data ?? []).map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Job Application (optional)</Label>
            <Select value={jobApplicationId} onValueChange={setJobApplicationId}>
              <SelectTrigger>
                <SelectValue placeholder="None — reusable draft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None — reusable draft</SelectItem>
                {(applications.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.companies?.name} — {a.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
