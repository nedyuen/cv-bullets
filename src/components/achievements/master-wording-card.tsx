import { useState } from "react";
import { History, Save, Archive, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/common/multi-select";
import { useToast } from "@/components/ui/toast";
import {
  useMasterWordingVersions,
  useAddMasterWordingVersion,
  useUpdateMasterWordingJobTypes,
  useSetMasterWordingStatus,
  type MasterWordingWithDetail,
} from "@/hooks/useMasterWordings";
import { useJobTypes } from "@/hooks/useSettings";
import { format } from "date-fns";

export function MasterWordingCard({ wording }: { wording: MasterWordingWithDetail }) {
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(wording.currentVersion?.text ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [jobTypeIds, setJobTypeIds] = useState<string[]>(wording.jobTypeIds);

  const jobTypes = useJobTypes();
  const versions = useMasterWordingVersions(showHistory ? wording.id : undefined);
  const addVersion = useAddMasterWordingVersion();
  const updateJobTypes = useUpdateMasterWordingJobTypes();
  const setStatus = useSetMasterWordingStatus();
  const { toast } = useToast();

  const jobTypeOptions = (jobTypes.data ?? []).map((j) => ({ value: j.id, label: j.name }));
  const currentText = wording.currentVersion?.text ?? "";
  const textChanged = text.trim() !== currentText;

  const saveText = () => {
    if (!text.trim()) return;
    if (!textChanged) {
      // Job Type tag changes (if any) already saved independently via
      // saveJobTypes — nothing else changed, so don't stamp a new version.
      setEditing(false);
      setChangeNote("");
      return;
    }
    addVersion.mutate(
      { masterWordingId: wording.id, text: text.trim(), changeNote: changeNote.trim() || undefined },
      {
        onSuccess: () => {
          setEditing(false);
          setChangeNote("");
          toast({ title: "New version saved — history preserved", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't save version", description: e.message, variant: "destructive" }),
      },
    );
  };

  const saveJobTypes = (ids: string[]) => {
    setJobTypeIds(ids);
    updateJobTypes.mutate({ masterWordingId: wording.id, jobTypeIds: ids });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1 items-center">
              {jobTypeIds.length === 0 ? (
                <Badge variant="outline">Unclassified</Badge>
              ) : (
                jobTypeIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {jobTypes.data?.find((j) => j.id === id)?.name ?? id}
                  </Badge>
                ))
              )}
              <span className="text-xs text-muted-foreground">v{wording.currentVersion?.version_number}</span>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Change note (optional)"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                />
                <div className="w-64">
                  <MultiSelect options={jobTypeOptions} selected={jobTypeIds} onChange={saveJobTypes} placeholder="Job Types" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveText} disabled={addVersion.isPending}>
                    <Save className="h-3.5 w-3.5" /> {textChanged ? "Save as new version" : "Done"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{wording.currentVersion?.text}</p>
            )}
          </div>
          {!editing && (
            <div className="flex flex-col gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowHistory((s) => !s)}>
                <History className="h-3.5 w-3.5" /> History
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setStatus.mutate({ id: wording.id, status: wording.status === "active" ? "archived" : "active" })
                }
              >
                {wording.status === "active" ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>

        {showHistory && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Version History (immutable)</p>
            {(versions.data ?? []).map((v) => (
              <div key={v.id} className="text-sm rounded-md bg-muted/50 p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>v{v.version_number}</span>
                  <span>{format(new Date(v.created_at), "d MMM yyyy, HH:mm")}</span>
                </div>
                <p>{v.text}</p>
                {v.change_note && <p className="text-xs text-muted-foreground mt-1 italic">{v.change_note}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
