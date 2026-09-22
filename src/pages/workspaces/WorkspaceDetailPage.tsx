import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkspaceItemRow } from "@/components/workspace/workspace-item-row";
import { AddAchievementDialog } from "@/components/workspace/add-achievement-dialog";
import { CopyToWordButton } from "@/components/workspace/copy-to-word-button";
import { useWorkspace, useWorkspaceItems, useReorderWorkspaceItems, useUpdateWorkspace } from "@/hooks/useWorkspaces";
import { Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workspace = useWorkspace(id);
  const items = useWorkspaceItems(id);
  const reorder = useReorderWorkspaceItems();
  const updateWorkspace = useUpdateWorkspace();
  const { toast } = useToast();

  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const orderedItems = useMemo(() => {
    const data = items.data ?? [];
    if (!localOrder) return data;
    const byId = new Map(data.map((i) => [i.id, i]));
    return localOrder.map((itemId) => byId.get(itemId)).filter((i): i is NonNullable<typeof i> => !!i);
  }, [items.data, localOrder]);

  if (!workspace.data) return null;
  const w = workspace.data;

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIds = orderedItems.map((i) => i.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    const next = arrayMove(currentIds, oldIndex, newIndex);
    setLocalOrder(next);
    reorder.mutate(
      { workspaceId: id!, orderedIds: next },
      { onSettled: () => setLocalOrder(null) },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={w.name}
        actions={
          <div className="flex items-center gap-2">
            <AddAchievementDialog
              workspaceId={w.id}
              targetJobTypeId={w.job_type_id}
              existingAchievementIds={(items.data ?? []).map((i) => i.achievement_id)}
            />
            <CopyToWordButton items={orderedItems} />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateWorkspace.mutate(
                  { id: w.id, status: w.status === "active" ? "archived" : "active" },
                  { onSuccess: () => toast({ title: w.status === "active" ? "Archived" : "Restored" }) },
                )
              }
            >
              {w.status === "active" ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={w.status} />
        {w.job_types?.name && <Badge variant="secondary">Target: {w.job_types.name}</Badge>}
        {w.job_applications && (
          <Badge variant="outline">
            Linked to {w.job_applications.companies?.name} — {w.job_applications.job_title}
          </Badge>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orderedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedItems.map((item, index) => (
              <WorkspaceItemRow
                key={item.id}
                item={item}
                index={index}
                workspaceId={w.id}
                targetJobTypeId={w.job_type_id}
                jobApplicationId={w.job_application_id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {orderedItems.length === 0 && (
        <EmptyState title="No Achievements added yet" description="Add Achievements from your library to start assembling this CV draft." />
      )}
    </div>
  );
}
