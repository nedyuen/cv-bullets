import { useState } from "react";
import { ChevronDown, ChevronRight, Archive, RotateCcw } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { CompanyFormDialog } from "@/components/career/company-form-dialog";
import { CareerRoleFormDialog } from "@/components/career/career-role-form-dialog";
import { ProjectFormDialog } from "@/components/career/project-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCompanies, useUpdateCompany } from "@/hooks/useCompanies";
import { useCareerRoles, useUpdateCareerRole } from "@/hooks/useCareerRoles";
import { useProjects, useProjectAchievementCounts, useUpdateProject } from "@/hooks/useProjects";
import type { Status } from "@/types/database";
import { Link } from "react-router-dom";

function ArchiveToggleButton({ status, onToggle }: { status: Status; onToggle: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {status === "active" ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CompanyNode({
  companyId,
  companyName,
  companyStatus,
  includeArchived,
}: {
  companyId: string;
  companyName: string;
  companyStatus: Status;
  includeArchived: boolean;
}) {
  const [open, setOpen] = useState(true);
  const roles = useCareerRoles(includeArchived, companyId);
  const updateCompany = useUpdateCompany();

  return (
    <Card>
      {/* A <div role="button"> here, not a native <button>, because this row contains
          the nested Archive <button> — buttons cannot nest inside buttons in valid HTML. */}
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{companyName}</span>
          <StatusBadge status={companyStatus} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{roles.data?.length ?? 0} role(s)</span>
          <ArchiveToggleButton
            status={companyStatus}
            onToggle={() => updateCompany.mutate({ id: companyId, status: companyStatus === "active" ? "archived" : "active" })}
          />
        </div>
      </div>
      {open && (
        <CardContent className="pt-0 space-y-2">
          {(roles.data ?? []).map((role) => (
            <RoleNode
              key={role.id}
              roleId={role.id}
              title={role.title}
              status={role.status}
              startDate={role.start_date}
              endDate={role.end_date}
              includeArchived={includeArchived}
            />
          ))}
          {roles.data?.length === 0 && <p className="text-sm text-muted-foreground pl-6">No Career Roles yet.</p>}
        </CardContent>
      )}
    </Card>
  );
}

function RoleNode({
  roleId,
  title,
  status,
  startDate,
  endDate,
  includeArchived,
}: {
  roleId: string;
  title: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  includeArchived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const projects = useProjects(includeArchived, roleId);
  const counts = useProjectAchievementCounts();
  const updateRole = useUpdateCareerRole();
  const updateProject = useUpdateProject();

  return (
    <div className="rounded-md border pl-4">
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center justify-between p-2.5 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-sm font-medium">{title}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {startDate ?? "?"} – {endDate ?? "present"}
          </span>
          <ArchiveToggleButton status={status} onToggle={() => updateRole.mutate({ id: roleId, status: status === "active" ? "archived" : "active" })} />
        </div>
      </div>
      {open && (
        <div className="pl-6 pb-2 space-y-1">
          {(projects.data ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent">
              <Link to="/projects" className="flex-1">
                <span>{p.name}</span>
                <StatusBadge status={p.status} />
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{counts.data?.get(p.id) ?? 0} achievement(s)</span>
                <ArchiveToggleButton status={p.status} onToggle={() => updateProject.mutate({ id: p.id, status: p.status === "active" ? "archived" : "active" })} />
              </div>
            </div>
          ))}
          {projects.data?.length === 0 && <p className="text-sm text-muted-foreground px-2">No Projects yet.</p>}
        </div>
      )}
    </div>
  );
}

export function CareerPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const companies = useCompanies(includeArchived);

  return (
    <div>
      <PageHeader
        title="Career"
        description="Company → Career Role → Project — historical context for Achievements."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="includeArchivedCareer" checked={includeArchived} onCheckedChange={(v) => setIncludeArchived(v === true)} />
              <Label htmlFor="includeArchivedCareer" className="font-normal text-sm">
                Include Archived
              </Label>
            </div>
            <CompanyFormDialog />
            <CareerRoleFormDialog />
            <ProjectFormDialog />
          </div>
        }
      />
      <div className="space-y-3">
        {(companies.data ?? []).map((c) => (
          <CompanyNode key={c.id} companyId={c.id} companyName={c.name} companyStatus={c.status} includeArchived={includeArchived} />
        ))}
        {companies.data?.length === 0 && (
          <EmptyState title="No Companies yet" description="Add a Company to start building your career history." />
        )}
      </div>
    </div>
  );
}
