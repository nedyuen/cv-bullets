import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { MandatoryBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAchievements } from "@/hooks/useAchievements";
import { useJobTypes } from "@/hooks/useSettings";
import { useMasterWordingsForAchievements } from "@/hooks/useMasterWordings";
import { useProjects, useAchievementProjectsMap } from "@/hooks/useProjects";

const UNASSIGNED = "__unassigned__";

interface Row {
  achievementId: string;
  subject: string;
  mandatory: boolean;
  matchedWordingTexts: string[];
}

interface RoleGroup {
  careerRoleId: string;
  careerRoleTitle: string;
  rows: Row[];
}

interface CompanyGroup {
  companyId: string;
  companyName: string;
  roles: RoleGroup[];
}

export function MasterViewsPage() {
  const [jobTypeId, setJobTypeId] = useState<string | undefined>(undefined);

  const jobTypes = useJobTypes();
  const achievements = useAchievements({ jobTypeId });
  const ids = useMemo(() => (achievements.data ?? []).map((a) => a.id), [achievements.data]);
  const masterWordings = useMasterWordingsForAchievements(ids);
  const achievementProjects = useAchievementProjectsMap(ids);
  const projects = useProjects();

  const projectById = useMemo(() => new Map((projects.data ?? []).map((p) => [p.id, p])), [projects.data]);

  // Grouped by Company > Career Role, derived from each Achievement's
  // Projects (achievement_relevant_projects, so Compound Achievements'
  // inherited Projects are reflected too). An Achievement whose Projects span
  // more than one Career Role appears once under each — reflecting the
  // underlying many-to-many reality rather than forcing a single owner.
  // Achievements with no resolvable Project land in "Unassigned".
  const companyGroups = useMemo(() => {
    if (!jobTypeId) return [];

    const rows: Row[] = (achievements.data ?? []).map((a) => {
      const matchedWordingTexts = (masterWordings.data ?? [])
        .filter((w) => w.achievement_id === a.id && w.jobTypeIds.includes(jobTypeId))
        .map((w) => w.currentVersion?.text)
        .filter((t): t is string => !!t);
      return { achievementId: a.id, subject: a.subject, mandatory: a.mandatory, matchedWordingTexts };
    });

    const companies = new Map<string, CompanyGroup>();
    const ensureCompany = (companyId: string, companyName: string): CompanyGroup => {
      let c = companies.get(companyId);
      if (!c) {
        c = { companyId, companyName, roles: [] };
        companies.set(companyId, c);
      }
      return c;
    };
    const ensureRole = (company: CompanyGroup, careerRoleId: string, careerRoleTitle: string): RoleGroup => {
      let r = company.roles.find((r) => r.careerRoleId === careerRoleId);
      if (!r) {
        r = { careerRoleId, careerRoleTitle, rows: [] };
        company.roles.push(r);
      }
      return r;
    };

    for (const row of rows) {
      const projectIds = achievementProjects.data?.get(row.achievementId) ?? [];
      const placements = projectIds
        .map((pid) => projectById.get(pid)?.career_roles)
        .filter((cr): cr is NonNullable<typeof cr> => !!cr);
      const seen = new Set<string>();
      let placedAny = false;
      for (const cr of placements) {
        const companyId = cr.companies?.id ?? UNASSIGNED;
        const companyName = cr.companies?.name ?? "Unassigned";
        const key = `${companyId}::${cr.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const company = ensureCompany(companyId, companyName);
        const role = ensureRole(company, cr.id, cr.title);
        role.rows.push(row);
        placedAny = true;
      }
      if (!placedAny) {
        const company = ensureCompany(UNASSIGNED, "Unassigned");
        const role = ensureRole(company, UNASSIGNED, "No Career Role");
        role.rows.push(row);
      }
    }

    const sortRows = (a: Row, b: Row) => {
      if ((a.matchedWordingTexts.length > 0) !== (b.matchedWordingTexts.length > 0)) {
        return a.matchedWordingTexts.length > 0 ? -1 : 1;
      }
      return a.subject.localeCompare(b.subject);
    };

    const result = [...companies.values()];
    result.sort((a, b) => (a.companyId === UNASSIGNED ? 1 : b.companyId === UNASSIGNED ? -1 : a.companyName.localeCompare(b.companyName)));
    for (const company of result) {
      company.roles.sort((a, b) => (a.careerRoleId === UNASSIGNED ? 1 : b.careerRoleId === UNASSIGNED ? -1 : a.careerRoleTitle.localeCompare(b.careerRoleTitle)));
      for (const role of company.roles) role.rows.sort(sortRows);
    }
    return result;
  }, [jobTypeId, achievements.data, masterWordings.data, achievementProjects.data, projectById]);

  const hasAnyRows = companyGroups.some((c) => c.roles.some((r) => r.rows.length > 0));

  return (
    <div>
      <PageHeader title="Master Views" description="Pick a target career direction to see the wording relevant to it, grouped by Company and Career Role." />

      <Card className="mb-4">
        <CardContent className="pt-3.5">
          <Select value={jobTypeId ?? ""} onValueChange={setJobTypeId}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select a Job Type" />
            </SelectTrigger>
            <SelectContent>
              {(jobTypes.data ?? []).map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!jobTypeId && (
        <EmptyState title="No Job Type selected" description="Choose a Job Type above to see its relevant Achievements and wording." />
      )}

      {jobTypeId && !hasAnyRows && (
        <EmptyState title="No relevant Achievements" description="No Achievements are directly tagged, or tagged via a Master Wording, to this Job Type yet." />
      )}

      {jobTypeId && hasAnyRows && (
        <div className="space-y-5">
          {companyGroups.map((company) => (
            <div key={company.companyId}>
              <h2 className="text-sm font-semibold text-foreground mb-2">{company.companyName}</h2>
              <div className="space-y-4 pl-3 border-l">
                {company.roles.map((role) => (
                  <div key={role.careerRoleId}>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1.5">{role.careerRoleTitle}</h3>
                    <div className="space-y-1.5">
                      {role.rows.map((row) => (
                        <Card key={row.achievementId}>
                          <CardContent className="py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/achievements/${row.achievementId}`} className="font-semibold text-sm text-foreground hover:underline">
                                {row.subject}
                              </Link>
                              {row.mandatory && <MandatoryBadge mandatory={row.mandatory} />}
                            </div>

                            {row.matchedWordingTexts.length > 0 ? (
                              <div className="mt-1.5 space-y-1.5">
                                {row.matchedWordingTexts.map((text, i) => (
                                  <p key={i} className="text-sm text-foreground">
                                    {text}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-1.5 text-sm text-muted-foreground italic">
                                No Master Wording for this Job Type yet — shown by Subject.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
