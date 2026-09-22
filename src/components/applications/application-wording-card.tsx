import { useState } from "react";
import { format } from "date-fns";
import { History, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PromoteToMasterDialog } from "@/components/applications/promote-to-master-dialog";
import { useApplicationWordingVersions, useAddApplicationWordingVersion, type ApplicationWordingWithDetail } from "@/hooks/useApplicationWordings";

export function ApplicationWordingCard({
  wording,
  showApplicationLink = true,
}: {
  wording: ApplicationWordingWithDetail;
  showApplicationLink?: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(wording.currentVersion?.text ?? "");

  const versions = useApplicationWordingVersions(showHistory ? wording.id : undefined);
  const addVersion = useAddApplicationWordingVersion();
  const { toast } = useToast();

  const save = () => {
    if (!text.trim()) return;
    addVersion.mutate(
      { applicationWordingId: wording.id, text: text.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          toast({ title: "New version saved — prior wording preserved", variant: "success" });
        },
        onError: (e) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            {showApplicationLink && wording.jobApplication && (
              <Link to={`/applications/${wording.jobApplication.id}`} className="text-xs text-primary hover:underline">
                {wording.jobApplication.companies?.name} — {wording.jobApplication.job_title}
                {wording.jobApplication.date_applied && ` · ${wording.jobApplication.date_applied}`}
              </Link>
            )}
            {wording.source_master_wording_id ? (
              <Badge variant="outline">From Master Wording (exact version used)</Badge>
            ) : (
              <Badge variant="outline">Written from scratch</Badge>
            )}
            {editing ? (
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
            ) : (
              <p className="text-sm">{wording.currentVersion?.text}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={addVersion.isPending}>
                <Save className="h-3.5 w-3.5" /> Save as new version
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowHistory((s) => !s)}>
                <History className="h-3.5 w-3.5" /> History
              </Button>
              <PromoteToMasterDialog applicationWordingId={wording.id} achievementIds={wording.achievementIds} text={wording.currentVersion?.text ?? ""} />
            </>
          )}
        </div>
        {showHistory && (
          <div className="border-t pt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Version History (immutable)</p>
            {(versions.data ?? []).map((v) => (
              <div key={v.id} className="text-sm rounded-md bg-muted/50 p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>v{v.version_number}</span>
                  <span>{format(new Date(v.created_at), "d MMM yyyy, HH:mm")}</span>
                </div>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
