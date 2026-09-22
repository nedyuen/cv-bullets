import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Eye, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MandatoryBadge } from "@/components/common/status-badge";
import { Link } from "react-router-dom";
import { ReplaceWordingDialog } from "@/components/workspace/replace-wording-dialog";
import { SaveAsApplicationWordingDialog } from "@/components/workspace/save-as-application-wording-dialog";
import { useMasterWordingVersionById } from "@/hooks/useMasterWordings";
import { useUpdateWorkspaceItemText, useRemoveWorkspaceItem, type WorkspaceItemWithAchievement } from "@/hooks/useWorkspaces";
import { useToast } from "@/components/ui/toast";

export function WorkspaceItemRow({
  item,
  index,
  workspaceId,
  targetJobTypeId,
  jobApplicationId,
}: {
  item: WorkspaceItemWithAchievement;
  index: number;
  workspaceId: string;
  targetJobTypeId: string | null;
  jobApplicationId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.snapshot_text);
  const [showOriginal, setShowOriginal] = useState(false);

  const originalVersion = useMasterWordingVersionById(item.selected_master_wording_version_id);
  const updateText = useUpdateWorkspaceItemText();
  const removeItem = useRemoveWorkspaceItem();
  const { toast } = useToast();

  const edited = originalVersion.data ? originalVersion.data.text !== item.snapshot_text : false;
  const source = item.selected_master_wording_id ? "Master Wording" : "Manual / custom";

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const save = () => {
    updateText.mutate(
      { id: item.id, snapshotText: draft, workspaceId },
      {
        onSuccess: () => {
          setEditing(false);
          toast({ title: "Workspace wording updated" });
        },
      },
    );
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="py-3">
        <div className="flex gap-3">
          <button className="mt-1 cursor-grab text-muted-foreground touch-none" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="mt-0.5 text-xs font-mono text-muted-foreground w-5">{index + 1}</span>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/achievements/${item.achievement_id}`} className="text-sm font-medium hover:underline">
                {item.achievements?.subject}
              </Link>
              <MandatoryBadge mandatory={item.achievements?.mandatory ?? false} />
              <Badge variant="outline">{source}</Badge>
              {edited && <Badge variant="warning">Edited in Workspace</Badge>}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={save} disabled={updateText.isPending}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(item.snapshot_text); }}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{item.snapshot_text}</p>
            )}

            {edited && showOriginal && originalVersion.data && (
              <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                <p className="font-medium mb-0.5">Original selected wording:</p>
                <p>{originalVersion.data.text}</p>
              </div>
            )}

            {!editing && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Edit here
                </Button>
                <ReplaceWordingDialog itemId={item.id} workspaceId={workspaceId} achievementId={item.achievement_id} targetJobTypeId={targetJobTypeId} />
                {edited && (
                  <Button size="sm" variant="ghost" onClick={() => setShowOriginal((s) => !s)}>
                    <Eye className="h-3.5 w-3.5" /> {showOriginal ? "Hide" : "View"} original
                  </Button>
                )}
                <SaveAsApplicationWordingDialog item={item} defaultJobApplicationId={jobApplicationId} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeItem.mutate({ id: item.id, workspaceId })}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
