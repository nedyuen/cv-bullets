import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { WorkspaceItemWithAchievement } from "@/hooks/useWorkspaces";
import { ClipboardCopy } from "lucide-react";

export function CopyToWordButton({ items }: { items: WorkspaceItemWithAchievement[] }) {
  const { toast } = useToast();

  const copy = async () => {
    const text = items.map((i) => `• ${i.snapshot_text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Paste into Word and format your CV.", variant: "success" });
    } catch {
      toast({ title: "Couldn't copy to clipboard", variant: "destructive" });
    }
  };

  return (
    <Button onClick={copy} disabled={items.length === 0}>
      <ClipboardCopy className="h-4 w-4" /> Copy to Word
    </Button>
  );
}
