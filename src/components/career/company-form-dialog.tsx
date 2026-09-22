import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateCompany } from "@/hooks/useCompanies";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

export function CompanyFormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateCompany();
  const { toast } = useToast();

  const submit = () => {
    if (!name.trim()) return;
    create.mutate(name.trim(), {
      onSuccess: () => {
        setOpen(false);
        setName("");
        toast({ title: "Company added", variant: "success" });
      },
      onError: (e) => toast({ title: "Couldn't add Company", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Name</Label>
          <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Corp" />
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
