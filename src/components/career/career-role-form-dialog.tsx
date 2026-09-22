import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCompanies } from "@/hooks/useCompanies";
import { useCreateCareerRole } from "@/hooks/useCareerRoles";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

export function CareerRoleFormDialog({ defaultCompanyId }: { defaultCompanyId?: string }) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const companies = useCompanies();
  const create = useCreateCareerRole();
  const { toast } = useToast();

  const reset = () => {
    setCompanyId(defaultCompanyId ?? "");
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  const submit = () => {
    if (!companyId || !title.trim()) return;
    create.mutate(
      {
        company_id: companyId,
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          toast({ title: "Career Role added", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't add Career Role", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Career Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Career Role</DialogTitle>
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
          <Button onClick={submit} disabled={create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
