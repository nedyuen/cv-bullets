import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useCompanies, useCreateCompany } from "@/hooks/useCompanies";
import { useJobTypes } from "@/hooks/useSettings";
import {
  useCreateJobApplication,
  useUpdateJobApplication,
  APPLICATION_STAGES,
  type JobApplicationWithContext,
} from "@/hooks/useJobApplications";
import type { ApplicationStage } from "@/types/database";
import { Plus, Pencil } from "lucide-react";

const NONE = "__none__";

export function JobApplicationFormDialog({ application, trigger }: { application?: JobApplicationWithContext; trigger?: React.ReactNode }) {
  const isEdit = !!application;
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTypeId, setJobTypeId] = useState<string>(NONE);
  const [dateApplied, setDateApplied] = useState("");
  const [postingUrl, setPostingUrl] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [applicationStage, setApplicationStage] = useState<ApplicationStage>("pending_application");

  const companies = useCompanies();
  const createCompany = useCreateCompany();
  const jobTypes = useJobTypes();
  const create = useCreateJobApplication();
  const update = useUpdateJobApplication();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (isEdit && application) {
      setCompanyName(application.companies?.name ?? "");
      setJobTitle(application.job_title);
      setJobTypeId(application.job_type_id ?? NONE);
      setDateApplied(application.date_applied ?? "");
      setPostingUrl(application.job_posting_url ?? "");
      setTargetSalary(application.target_salary ?? "");
      setApplicationStage(application.application_stage);
    } else {
      setCompanyName("");
      setJobTitle("");
      setJobTypeId(NONE);
      setDateApplied("");
      setPostingUrl("");
      setTargetSalary("");
      setApplicationStage("pending_application");
    }
  }, [open, isEdit, application]);

  const submit = async () => {
    const name = companyName.trim();
    if (!name || !jobTitle.trim()) return;
    const onError = (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" });

    // Company is a free-text field here (no dropdown) — resolve it to the
    // existing Company record by name if one exists (so repeat applications
    // to the same company, or one also used for a Career Role, stay linked
    // to a single record), otherwise create it. Case-insensitive so "Acme"
    // and "ACME" don't silently create duplicates.
    let companyId = (companies.data ?? []).find((c) => c.name.toLowerCase() === name.toLowerCase())?.id;
    if (!companyId) {
      try {
        companyId = (await createCompany.mutateAsync(name)).id;
      } catch (e) {
        onError(e as Error);
        return;
      }
    }

    const input = {
      company_id: companyId,
      job_title: jobTitle.trim(),
      job_type_id: jobTypeId === NONE ? null : jobTypeId,
      date_applied: dateApplied || null,
      job_posting_url: postingUrl.trim() || null,
      target_salary: targetSalary.trim() || null,
      application_stage: applicationStage,
    };
    const onSuccess = () => {
      setOpen(false);
      toast({ title: isEdit ? "Application updated" : "Application created", variant: "success" });
    };

    if (isEdit) update.mutate({ id: application!.id, ...input }, { onSuccess, onError });
    else create.mutate(input, { onSuccess, onError });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit" : "New Application"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Job Application" : "New Job Application"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="application-company">Company</Label>
            <Input id="application-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company you're applying to" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="application-job-title">Job Title</Label>
            <Input id="application-job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. AI Transformation Lead" />
          </div>
          <div className="space-y-1.5">
            <Label>Job Type</Label>
            <Select value={jobTypeId} onValueChange={setJobTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {(jobTypes.data ?? []).map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Application Status</Label>
            <Select value={applicationStage} onValueChange={(v) => setApplicationStage(v as ApplicationStage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="application-date-applied">Date Applied</Label>
              <Input id="application-date-applied" type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="application-target-salary">Target Salary</Label>
              <Input id="application-target-salary" value={targetSalary} onChange={(e) => setTargetSalary(e.target.value)} placeholder="e.g. £120,000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="application-posting-url">Job Posting URL</Label>
            <Input id="application-posting-url" value={postingUrl} onChange={(e) => setPostingUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending || update.isPending || createCompany.isPending}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
