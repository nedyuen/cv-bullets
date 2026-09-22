import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useCompoundComponents, useUsedAsComponentIn, useSetCompoundComponents } from "@/hooks/useCompoundAchievements";
import { Layers } from "lucide-react";

function EditComponentsDialog({ achievementId, currentComponentIds }: { achievementId: string; currentComponentIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentComponentIds);
  const achievements = useAchievements({});
  const setComponents = useSetCompoundComponents();
  const { toast } = useToast();

  useEffect(() => {
    if (open) setSelected(currentComponentIds);
  }, [open, currentComponentIds]);

  const options = (achievements.data ?? []).filter((a) => a.id !== achievementId).map((a) => ({ value: a.id, label: a.subject }));

  const submit = () => {
    setComponents.mutate(
      { compoundAchievementId: achievementId, componentIds: selected },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Components updated", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't update components", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Layers className="h-4 w-4" /> {currentComponentIds.length > 0 ? "Edit Components" : "Make Compound Achievement"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compound Achievement Components</DialogTitle>
          <DialogDescription>
            Choose the existing Achievements this one is composed of. Nesting is allowed, but a circular composition (this Achievement
            eventually containing itself) will be rejected.
          </DialogDescription>
        </DialogHeader>
        <MultiSelect options={options} selected={selected} onChange={setSelected} placeholder="Select component Achievements" />
        <DialogFooter>
          <Button onClick={submit} disabled={setComponents.isPending || selected.length === 0}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CompoundRelationshipsCard({ achievementId }: { achievementId: string }) {
  const components = useCompoundComponents(achievementId);
  const usedWithin = useUsedAsComponentIn(achievementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compound Relationships</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Components (this is a Compound Achievement of)</p>
            <EditComponentsDialog achievementId={achievementId} currentComponentIds={(components.data ?? []).map((c) => c.id)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(components.data ?? []).map((c) => (
              <Link key={c.id} to={`/achievements/${c.id}`}>
                <Badge variant="secondary">{c.subject}</Badge>
              </Link>
            ))}
            {components.data?.length === 0 && <span className="text-sm text-muted-foreground">Not a Compound Achievement.</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Used as a component within</p>
          <div className="flex flex-wrap gap-2">
            {(usedWithin.data ?? []).map((c) => (
              <Link key={c.id} to={`/achievements/${c.id}`}>
                <Badge variant="outline">{c.subject}</Badge>
              </Link>
            ))}
            {usedWithin.data?.length === 0 && <span className="text-sm text-muted-foreground">Not used as a component anywhere.</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
