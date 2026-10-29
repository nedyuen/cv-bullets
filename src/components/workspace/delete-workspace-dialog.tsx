import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDeleteWorkspace } from "@/hooks/useWorkspaces";

export function DeleteWorkspaceDialog({ workspaceId, name, itemCount }: { workspaceId: string; name: string; itemCount: number }) {
  const [open, setOpen] = useState(false);
  const deleteWorkspace = useDeleteWorkspace();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = () =>
    deleteWorkspace.mutate(workspaceId, {
      onSuccess: () => {
        toast({ title: "Workspace deleted", variant: "success" });
        navigate("/workspaces");
      },
      onError: (e) => toast({ title: "Couldn't delete Workspace", description: e.message, variant: "destructive" }),
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{name}"?</DialogTitle>
          <DialogDescription>
            This permanently deletes the Workspace
            {itemCount > 0 ? ` and its ${itemCount} selected Achievement${itemCount === 1 ? "" : "s"} with their wording snapshots` : ""}. This cannot be
            undone. Achievements, Master Wordings and any Application Wordings you saved from it are not affected. To keep it but hide it, use Archive instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteWorkspace.isPending}>
            Delete Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
