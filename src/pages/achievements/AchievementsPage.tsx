import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge, MandatoryBadge } from "@/components/common/status-badge";
import { JobTypeBadges } from "@/components/achievements/job-type-badges";
import { AchievementFormDialog } from "@/components/achievements/achievement-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAchievements, type AchievementFilters } from "@/hooks/useAchievements";
import { useJobTypes, useCompetencies, useTags } from "@/hooks/useSettings";
import { useCompanies } from "@/hooks/useCompanies";
import { useCareerRoles } from "@/hooks/useCareerRoles";
import { useProjects } from "@/hooks/useProjects";
import { useRelevantJobTypesMap } from "@/hooks/useRelevantJobTypes";
import { useMasterWordingsForAchievements } from "@/hooks/useMasterWordings";
import { useCompoundAchievementIds } from "@/hooks/useCompoundAchievements";
import { cn } from "@/lib/utils";

const ANY = "__any__";
const YES = "__yes__";
const NO = "__no__";

function triState(value: string): boolean | undefined {
  if (value === YES) return true;
  if (value === NO) return false;
  return undefined;
}

export function AchievementsPage() {
  const [search, setSearch] = useState("");
  const [jobTypeId, setJobTypeId] = useState<string>(ANY);
  const [competencyId, setCompetencyId] = useState<string>(ANY);
  const [companyId, setCompanyId] = useState<string>(ANY);
  const [careerRoleId, setCareerRoleId] = useState<string>(ANY);
  const [projectId, setProjectId] = useState<string>(ANY);
  const [tagId, setTagId] = useState<string>(ANY);
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [hasMasterWording, setHasMasterWording] = useState<string>(ANY);
  const [hasApplicationWording, setHasApplicationWording] = useState<string>(ANY);
  const [usedInWorkspace, setUsedInWorkspace] = useState<string>(ANY);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const jobTypes = useJobTypes();
  const competencies = useCompetencies();
  const companies = useCompanies();
  const careerRoles = useCareerRoles();
  const projects = useProjects();
  const tags = useTags();

  const filters: AchievementFilters = {
    search,
    jobTypeId: jobTypeId === ANY ? undefined : jobTypeId,
    competencyId: competencyId === ANY ? undefined : competencyId,
    companyId: companyId === ANY ? undefined : companyId,
    careerRoleId: careerRoleId === ANY ? undefined : careerRoleId,
    projectId: projectId === ANY ? undefined : projectId,
    tagId: tagId === ANY ? undefined : tagId,
    mandatory: mandatoryOnly ? true : undefined,
    includeArchived,
    hasMasterWording: triState(hasMasterWording),
    hasApplicationWording: triState(hasApplicationWording),
    usedInWorkspace: triState(usedInWorkspace),
  };

  const activeFilterCount = [
    jobTypeId !== ANY,
    competencyId !== ANY,
    companyId !== ANY,
    careerRoleId !== ANY,
    projectId !== ANY,
    tagId !== ANY,
    mandatoryOnly,
    includeArchived,
    hasMasterWording !== ANY,
    hasApplicationWording !== ANY,
    usedInWorkspace !== ANY,
  ].filter(Boolean).length;

  const achievements = useAchievements(filters);
  const ids = useMemo(() => (achievements.data ?? []).map((a) => a.id), [achievements.data]);
  const relevantJobTypes = useRelevantJobTypesMap(ids);
  const compoundIds = useCompoundAchievementIds(ids);
  const jobTypesById = useMemo(() => new Map((jobTypes.data ?? []).map((j) => [j.id, j])), [jobTypes.data]);
  const masterWordings = useMasterWordingsForAchievements([...expanded]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Achievements" description="Your searchable library of professional accomplishments." actions={<AchievementFormDialog />} />

      <Card className="mb-4">
        <CardContent className="pt-3.5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search Achievements, Wordings, Tags, Competencies, Project, Company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden shrink-0"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
          <div className={cn("grid grid-cols-2 gap-2 md:grid-cols-4", filtersOpen ? "grid" : "hidden md:grid")}>
            <Select value={jobTypeId} onValueChange={setJobTypeId}>
              <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Job Type</SelectItem>
                {(jobTypes.data ?? []).map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={competencyId} onValueChange={setCompetencyId}>
              <SelectTrigger><SelectValue placeholder="Competency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Competency</SelectItem>
                {(competencies.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Company</SelectItem>
                {(companies.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={careerRoleId} onValueChange={setCareerRoleId}>
              <SelectTrigger><SelectValue placeholder="Career Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Career Role</SelectItem>
                {(careerRoles.data ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Project</SelectItem>
                {(projects.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any Tag</SelectItem>
                {(tags.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={hasMasterWording} onValueChange={setHasMasterWording}>
              <SelectTrigger><SelectValue placeholder="Has Master Wording" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Has Master Wording: Any</SelectItem>
                <SelectItem value={YES}>Has Master Wording: Yes</SelectItem>
                <SelectItem value={NO}>Has Master Wording: No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasApplicationWording} onValueChange={setHasApplicationWording}>
              <SelectTrigger><SelectValue placeholder="Has Application Wording" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Has Application Wording: Any</SelectItem>
                <SelectItem value={YES}>Has Application Wording: Yes</SelectItem>
                <SelectItem value={NO}>Has Application Wording: No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={usedInWorkspace} onValueChange={setUsedInWorkspace}>
              <SelectTrigger><SelectValue placeholder="Workspace usage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Workspace usage: Any</SelectItem>
                <SelectItem value={YES}>Used in a Workspace</SelectItem>
                <SelectItem value={NO}>Not used in a Workspace</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-1">
              <Checkbox id="mandatoryOnly" checked={mandatoryOnly} onCheckedChange={(v) => setMandatoryOnly(v === true)} />
              <Label htmlFor="mandatoryOnly" className="font-normal">Mandatory only</Label>
            </div>
            <div className="flex items-center gap-2 px-1">
              <Checkbox id="includeArchived" checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
              <Label htmlFor="includeArchived" className="font-normal">Include Archived</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        {(achievements.data ?? []).map((a) => {
          const isOpen = expanded.has(a.id);
          const wordings = (masterWordings.data ?? []).filter((w) => w.achievement_id === a.id);
          return (
            <Card key={a.id}>
              <CardContent className="py-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                  {/* A <div role="button"> here, not a native <button> — this row contains a
                      nested <Link> (anchor), and interactive content can't nest inside <button>. */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-start gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleExpand(a.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleExpand(a.id)}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/achievements/${a.id}`} className="font-semibold text-sm text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
                          {a.subject}
                        </Link>
                        {a.mandatory && <MandatoryBadge mandatory={a.mandatory} />}
                        {compoundIds.data?.has(a.id) && <Badge variant="secondary">Compound</Badge>}
                        {a.status === "archived" && <StatusBadge status={a.status} />}
                        <span className="hidden sm:inline text-[11px] text-muted-foreground font-mono ml-auto shrink-0">{a.id.slice(0, 8)}</span>
                      </div>
                      {a.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">{a.description}</p>}
                      <div className="mt-1.5">
                        <JobTypeBadges relevant={relevantJobTypes.data?.get(a.id)} jobTypesById={jobTypesById} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/achievements/${a.id}`}>Open</Link>
                    </Button>
                    <AchievementFormDialog achievement={a} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-2.5 pl-6 space-y-2 border-l">
                    <p className="text-xs font-medium text-muted-foreground pl-3">Master Wordings</p>
                    {wordings.length === 0 && <p className="text-sm text-muted-foreground pl-3">No Master Wordings yet.</p>}
                    {wordings.map((w) => (
                      <div key={w.id} className="pl-3">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {w.jobTypeIds.length === 0 ? (
                            <Badge variant="outline">Unclassified</Badge>
                          ) : (
                            w.jobTypeIds.map((jt) => <Badge key={jt} variant="secondary">{jobTypesById.get(jt)?.name ?? jt}</Badge>)
                          )}
                        </div>
                        <p className="text-sm">{w.currentVersion?.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {achievements.data?.length === 0 && (
          <EmptyState title="No Achievements match your filters" description="Try clearing filters, or add your first Achievement." />
        )}
      </div>
    </div>
  );
}
