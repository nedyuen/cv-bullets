import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCompanies } from "@/hooks/useCompanies";
import { useCreateCareerRole, useUpdateCareerRole, type CareerRoleWithCompany } from "@/hooks/useCareerRoles";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil } from "lucide-react";

interface CareerRoleFormDialogProps {
  defaultCompanyId?: string;
  careerRole?: CareerRoleWithCompany; // when present, edits in place
  trigger?: React.ReactNode;
}

export function CareerRoleFormDialog({ defaultCompanyId, careerRole, trigger }: CareerRoleFormDialogProps) {
  const isEdit = !!careerRole;
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const companies = useCompanies();
  const create = useCreateCareerRole();
  const update = useUpdateCareerRole();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (isEdit && careerRole) {
      setCompanyId(careerRole.company_id);
      setTitle(careerRole.title);
      setDescription(careerRole.description ?? "");
      setStartDate(careerRole.start_date ?? "");
      setEndDate(careerRole.end_date ?? "");
    } else {
      setCompanyId(defaultCompanyId ?? "");
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    }
  }, [open, isEdit, careerRole, defaultCompanyId]);

  const submit = () => {
    if (!companyId || !title.trim()) return;
    const fields = {
      company_id: companyId,
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
    };
    const onSuccess = () => {
      setOpen(false);
      toast({ title: isEdit ? "Career Role updated" : "Career Role added", variant: "success" });
    };
    const onError = (e: Error) => toast({ title: "Couldn't save Career Role", description: e.message, variant: "destructive" });

    if (isEdit) {
      update.mutate({ id: careerRole!.id, ...fields }, { onSuccess, onError });
    } else {
      create.mutate(fields, { onSuccess, onError });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit" : "Career Role"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Career Role" : "New Career Role"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {(companies.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-title">Title</Label>
            <Input id="role-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Transformation Team Lead" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role-start">Start Date</Label>
              <Input id="role-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-end">End Date</Label>
              <Input id="role-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Textarea id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
