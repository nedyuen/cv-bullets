import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Achievement } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MandatoryBadge } from "@/components/common/status-badge";
import { useToast } from "@/components/ui/toast";
import { AchievementQuickEdit } from "@/components/workspace/achievement-quick-edit";
import { useAchievements } from "@/hooks/useAchievements";
import { useMasterWordingsForAchievements, type MasterWordingWithDetail } from "@/hooks/useMasterWordings";
import { useApplicationWordingsForAchievement } from "@/hooks/useApplicationWordings";
import { useAddWorkspaceItem, useWorkspaceTargetMatches } from "@/hooks/useWorkspaces";
import { useCompetencies, useJobTypes } from "@/hooks/useSettings";

interface AddAchievementsViewProps {
  workspaceId: string;
  targetJobTypeId: string | null;
  targetCompetencyIds: string[];
  existingAchievementIds: string[];
  onDone: () => void;
}

type ViewFilter = "all" | "included" | "needs_wording" | "excluded";

type WordingChoice =
  | { kind: "master"; wording: MasterWordingWithDetail }
  | { kind: "application"; text: string }
  | { kind: "custom"; text: string };

function choiceText(choice: WordingChoice | undefined): string {
  if (!choice) return "";
  if (choice.kind === "master") return choice.wording.currentVersion?.text ?? "";
  return choice.text;
}

export function AddAchievementsView({ workspaceId, targetJobTypeId, targetCompetencyIds, existingAchievementIds, onDone }: AddAchievementsViewProps) {
  const [view, setView] = useState<ViewFilter>("all");
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [choices, setChoices] = useState<Map<string, WordingChoice>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const jobTypes = useJobTypes();
  const competencies = useCompetencies();
  const matches = useWorkspaceTargetMatches(targetJobTypeId, targetCompetencyIds);
  const achievements = useAchievements({ search, includeArchived: false });
  const candidates = useMemo(
    () => (achievements.data ?? []).filter((a) => !existingAchievementIds.includes(a.id)),
    [achievements.data, existingAchievementIds],
  );
  const masterWordings = useMasterWordingsForAchievements(candidates.map((a) => a.id));
  const addItem = useAddWorkspaceItem();
  const { toast } = useToast();

  const wordingsByAchievement = useMemo(() => {
    const map = new Map<string, MasterWordingWithDetail[]>();
    for (const w of masterWordings.data ?? []) {
      const arr = map.get(w.achievement_id) ?? [];
      arr.push(w);
      map.set(w.achievement_id, arr);
    }
    return map;
  }, [masterWordings.data]);

  // Recommendation (user-overridable): Mandatory always, otherwise include if
  // the Achievement matches the Workspace's Job Type or any target Competency.
  const reasonsFor = (a: Achievement): string[] => {
    const reasons: string[] = [];
    if (a.mandatory) reasons.push("Mandatory");
    if (matches.data?.jobTypeMatches.has(a.id)) reasons.push(jobTypes.data?.find((j) => j.id === targetJobTypeId)?.name ?? "Job Type");
    for (const cid of matches.data?.competencyMatches.get(a.id) ?? []) {
      const name = competencies.data?.find((c) => c.id === cid)?.name;
      if (name) reasons.push(name);
    }
    return reasons;
  };
  const isIncluded = (a: Achievement) => overrides.get(a.id) ?? reasonsFor(a).length > 0;
  const setIncluded = (a: Achievement, value: boolean) => setOverrides((prev) => new Map(prev).set(a.id, value));

  // Exactly one Master Wording tagged for the target Job Type is selected
  // automatically (spec §31); an explicit user pick always wins.
  const effectiveChoice = (id: string): WordingChoice | undefined => {
    const explicit = choices.get(id);
    if (explicit) return explicit;
    if (!targetJobTypeId) return undefined;
    const tagged = (wordingsByAchievement.get(id) ?? []).filter((w) => w.jobTypeIds.includes(targetJobTypeId));
    return tagged.length === 1 ? { kind: "master", wording: tagged[0] } : undefined;
  };

  const included = candidates.filter(isIncluded);
  const excluded = candidates.filter((a) => !isIncluded(a));
  const missingWording = included.filter((a) => !choiceText(effectiveChoice(a.id)).trim());
  const hasTargets = !!targetJobTypeId || targetCompetencyIds.length > 0;

  const pickWording = (a: Achievement, choice: WordingChoice) => {
    setChoices((prev) => new Map(prev).set(a.id, choice));
    if (!isIncluded(a)) setIncluded(a, true);
  };

  const confirm = async () => {
    if (missingWording.length > 0) return;
    setAdding(true);
    let added = 0;
    try {
      // Sequential: useAddWorkspaceItem derives display_order from the current row count.
      for (const a of included) {
        const choice = effectiveChoice(a.id)!;
        await addItem.mutateAsync({
          workspaceId,
          achievementId: a.id,
          snapshotText: choiceText(choice).trim(),
          selectedMasterWordingId: choice.kind === "master" ? choice.wording.id : null,
          selectedMasterWordingVersionId: choice.kind === "master" ? (choice.wording.currentVersion?.id ?? null) : null,
        });
        added++;
      }
      toast({ title: `Added ${added} Achievement${added === 1 ? "" : "s"} to Workspace`, variant: "success" });
      onDone();
    } catch (e) {
      toast({
        title: `Added ${added} of ${included.length}, then failed`,
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const renderGroup = (title: string, items: Achievement[]) =>
    items.length === 0 ? null : (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
        <div className="space-y-2">
          {items.map((a) => (
            <AchievementRow
              key={a.id}
              achievement={a}
              included={isIncluded(a)}
              reasons={reasonsFor(a)}
              expanded={expandedId === a.id}
              choice={effectiveChoice(a.id)}
              wordings={wordingsByAchievement.get(a.id) ?? []}
              targetJobTypeId={targetJobTypeId}
              jobTypeName={(id) => jobTypes.data?.find((j) => j.id === id)?.name}
              onToggleIncluded={(v) => setIncluded(a, v)}
              onToggleExpanded={() => setExpandedId(expandedId === a.id ? null : a.id)}
              onPick={(c) => pickWording(a, c)}
            />
          ))}
        </div>
      </div>
    );

  const filters: Array<{ value: ViewFilter; label: string; count: number }> = [
    { value: "all", label: "All", count: candidates.length },
    { value: "included", label: "Included", count: included.length },
    { value: "needs_wording", label: "Needs wording", count: missingWording.length },
    { value: "excluded", label: "Excluded", count: excluded.length },
  ];

  const visibleGroups = () => {
    if (view === "all") {
      return (
        <>
          {renderGroup(`Recommended to include (${included.length})`, included)}
          {renderGroup(`Recommended to exclude (${excluded.length})`, excluded)}
        </>
      );
    }
    const list = view === "included" ? included : view === "excluded" ? excluded : missingWording;
    return renderGroup(filters.find((f) => f.value === view)!.label, list);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {hasTargets
          ? "Recommended from this Workspace's target Job Type and Competencies (Mandatory is always included)."
          : "This Workspace has no target Job Type or Competencies — only Mandatory Achievements are recommended."}{" "}
        Tick to include or exclude; click an Achievement to choose or write its wording.
      </p>

      <div className="sticky top-0 z-10 -mx-1 bg-background px-1 py-2 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search Achievements..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={view === f.value ? "secondary" : "outline"}
              className={f.value === "needs_wording" && f.count > 0 && view !== f.value ? "border-destructive text-destructive" : undefined}
              onClick={() => setView(f.value)}
            >
              {f.label} ({f.count})
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleGroups()}
        {candidates.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No matching Achievements.</p>}
        {candidates.length > 0 && view !== "all" && filters.find((f) => f.value === view)!.count === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {view === "needs_wording" ? "Every included Achievement has wording." : "Nothing here."}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 z-20 -mx-1 border-t border-border bg-background px-1 py-3 flex items-center justify-end gap-3">
        {missingWording.length > 0 && (
          <button type="button" className="text-xs text-destructive mr-auto underline" onClick={() => setView("needs_wording")}>
            {missingWording.length} included Achievement{missingWording.length === 1 ? " needs" : "s need"} wording — show
          </button>
        )}
        <Button variant="outline" onClick={onDone} disabled={adding}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={adding || included.length === 0 || missingWording.length > 0}>
          Add {included.length} Achievement{included.length === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}

function AchievementRow({
  achievement: a,
  included,
  reasons,
  expanded,
  choice,
  wordings,
  targetJobTypeId,
  jobTypeName,
  onToggleIncluded,
  onToggleExpanded,
  onPick,
}: {
  achievement: Achievement;
  included: boolean;
  reasons: string[];
  expanded: boolean;
  choice: WordingChoice | undefined;
  wordings: MasterWordingWithDetail[];
  targetJobTypeId: string | null;
  jobTypeName: (id: string) => string | undefined;
  onToggleIncluded: (value: boolean) => void;
  onToggleExpanded: () => void;
  onPick: (choice: WordingChoice) => void;
}) {
  const [tab, setTab] = useState<"wording" | "details">("wording");
  const text = choiceText(choice).trim();
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <Card className={expanded ? "border-primary/50" : undefined}>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={included} onCheckedChange={(v) => onToggleIncluded(v === true)} />
          <button type="button" className="flex-1 min-w-0 text-left flex items-start gap-2" onClick={onToggleExpanded}>
            <Chevron className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{a.subject}</p>
              {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {reasons.map((r, i) => (
                  <Badge key={`${r}-${i}`} variant="outline" className="text-xs">
                    {r}
                  </Badge>
                ))}
              </div>
              {text ? (
                <p className="text-xs mt-1 line-clamp-2">
                  <span className="text-muted-foreground">
                    {choice?.kind === "master" ? "Master Wording: " : choice?.kind === "application" ? "Prior Application Wording: " : "Custom: "}
                  </span>
                  {text}
                </p>
              ) : (
                included && <p className="text-xs mt-1 text-destructive">Needs wording — click to choose</p>
              )}
            </div>
          </button>
          <MandatoryBadge mandatory={a.mandatory} />
        </div>
        {expanded && (
          <div className="border-t pt-3 space-y-3">
            <div className="flex gap-1">
              <Button size="sm" variant={tab === "wording" ? "secondary" : "ghost"} onClick={() => setTab("wording")}>
                Wording
              </Button>
              <Button size="sm" variant={tab === "details" ? "secondary" : "ghost"} onClick={() => setTab("details")}>
                Details, notes & competencies
              </Button>
              <Button asChild size="sm" variant="ghost">
                <a href={`/achievements/${a.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open Achievement
                </a>
              </Button>
            </div>
            {tab === "wording" ? (
              <WordingPicker
                achievementId={a.id}
                wordings={wordings}
                targetJobTypeId={targetJobTypeId}
                choice={choice}
                jobTypeName={jobTypeName}
                onPick={onPick}
              />
            ) : (
              <div className="space-y-3">
                {([
                  ["Description", a.description],
                  ["Significance & Impact", a.significance_impact],
                  ["Feedback", a.feedback],
                ] as const).map(
                  ([label, value]) =>
                    value && (
                      <div key={label} className="select-text">
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <p className="text-sm whitespace-pre-wrap">{value}</p>
                      </div>
                    ),
                )}
                <AchievementQuickEdit achievement={a} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WordingPicker({
  achievementId,
  wordings,
  targetJobTypeId,
  choice,
  jobTypeName,
  onPick,
}: {
  achievementId: string;
  wordings: MasterWordingWithDetail[];
  targetJobTypeId: string | null;
  choice: WordingChoice | undefined;
  jobTypeName: (id: string) => string | undefined;
  onPick: (choice: WordingChoice) => void;
}) {
  const applicationWordings = useApplicationWordingsForAchievement(achievementId);
  const tagged = wordings.filter((w) => targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId));
  const unclassified = wordings.filter((w) => w.jobTypeIds.length === 0);
  const other = wordings.filter((w) => w.jobTypeIds.length > 0 && !(targetJobTypeId && w.jobTypeIds.includes(targetJobTypeId)));
  const isMaster = (id: string) => choice?.kind === "master" && choice.wording.id === id;

  return (
    <div className="space-y-3">
      {tagged.length > 0 && (
        <WordingGroup title={`Master Wordings for ${jobTypeName(targetJobTypeId!) ?? "target Job Type"}`}>
          {tagged.map((w) => (
            <WordingOption key={w.id} selected={isMaster(w.id)} text={w.currentVersion?.text ?? ""} onSelect={() => onPick({ kind: "master", wording: w })} />
          ))}
        </WordingGroup>
      )}
      {unclassified.length > 0 && (
        <WordingGroup title="Unclassified Master Wordings">
          {unclassified.map((w) => (
            <WordingOption key={w.id} selected={isMaster(w.id)} text={w.currentVersion?.text ?? ""} onSelect={() => onPick({ kind: "master", wording: w })} />
          ))}
        </WordingGroup>
      )}
      {other.length > 0 && (
        <WordingGroup title="Master Wordings for other Job Types">
          {other.map((w) => (
            <WordingOption
              key={w.id}
              selected={isMaster(w.id)}
              text={w.currentVersion?.text ?? ""}
              badge={w.jobTypeIds.map((id) => jobTypeName(id)).join(", ")}
              onSelect={() => onPick({ kind: "master", wording: w })}
            />
          ))}
        </WordingGroup>
      )}
      {(applicationWordings.data?.length ?? 0) > 0 && (
        <WordingGroup title="Prior Application Wordings (inspiration)">
          {applicationWordings.data!.map((w) => (
            <WordingOption
              key={w.id}
              selected={choice?.kind === "application" && choice.text === w.currentVersion?.text}
              text={w.currentVersion?.text ?? ""}
              badge={w.jobApplication ? `${w.jobApplication.company_name} — ${w.jobApplication.job_title}` : undefined}
              onSelect={() => onPick({ kind: "application", text: w.currentVersion?.text ?? "" })}
            />
          ))}
        </WordingGroup>
      )}
      <WordingGroup title="Write custom text for this Workspace">
        <div className={`rounded-md border p-2 ${choice?.kind === "custom" ? "border-primary" : ""}`}>
          <Textarea
            value={choice?.kind === "custom" ? choice.text : ""}
            onChange={(e) => onPick({ kind: "custom", text: e.target.value })}
            rows={2}
            placeholder="Write wording directly for this Workspace..."
          />
        </div>
      </WordingGroup>
    </div>
  );
}

export function WordingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// A div rather than a <button> so the wording text can be highlighted and
// copied. Dragging out a text selection doesn't count as picking the option.
export function WordingOption({ text, badge, selected, onSelect }: { text: string; badge?: string; selected: boolean; onSelect: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`w-full text-left rounded-md border p-2.5 text-sm transition-colors cursor-pointer select-text ${selected ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
      onClick={() => {
        if (window.getSelection()?.toString()) return;
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {badge && (
        <Badge variant="outline" className="mb-1">
          {badge}
        </Badge>
      )}
      <p>{text}</p>
    </div>
  );
}
