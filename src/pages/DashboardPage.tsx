import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardCounts, useRecentApplications, useContentGaps } from "@/hooks/useDashboard";
import { useJobTypes } from "@/hooks/useSettings";

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card>
      <CardContent className="pt-3.5">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value ?? "—"}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const counts = useDashboardCounts();
  const recent = useRecentApplications();
  const jobTypes = useJobTypes();
  const [gapJobTypeId, setGapJobTypeId] = useState<string>("");
  const gaps = useContentGaps(gapJobTypeId || undefined);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A quick view of your career content library." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Active Workspaces" value={counts.data?.activeWorkspaces} />
        <StatCard label="Active Achievements" value={counts.data?.activeAchievements} />
        <StatCard label="Mandatory" value={counts.data?.mandatoryAchievements} />
        <StatCard label="Optional" value={counts.data?.optionalAchievements} />
        <StatCard label="Master Wordings" value={counts.data?.masterWordings} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recent.data ?? []).map((a) => (
              <Link key={a.id} to={`/applications/${a.id}`} className="block text-sm hover:underline">
                {a.companies?.name} — {a.job_title}
                {a.date_applied && <span className="text-muted-foreground"> · {a.date_applied}</span>}
              </Link>
            ))}
            {recent.data?.length === 0 && <p className="text-sm text-muted-foreground">No Applications yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Gaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={gapJobTypeId} onValueChange={setGapJobTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Job Type to check" />
              </SelectTrigger>
              <SelectContent>
                {(jobTypes.data ?? []).map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gapJobTypeId && (
              <div className="space-y-1">
                {(gaps.data ?? []).map((g) => (
                  <Link key={g.achievementId} to={`/achievements/${g.achievementId}`} className="block text-sm hover:underline">
                    {g.subject} — no Master Wording for this Job Type
                  </Link>
                ))}
                {gaps.data?.length === 0 && <p className="text-sm text-muted-foreground">No gaps — every relevant Achievement has wording for this Job Type.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
