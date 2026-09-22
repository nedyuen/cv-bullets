import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useCompanies } from "@/hooks/useCompanies";
import { useJobTypes } from "@/hooks/useSettings";
import { useCreateJobApplication, useUpdateJobApplication, type JobApplicationWithContext } from "@/hooks/useJobApplications";
import { Plus, Pencil } from "lucide-react";

const NONE = "__none__";

export function JobApplicationFormDialog({ application, trigger }: { application?: JobApplicationWithContext; trigger?: React.ReactNode }) {
  const isEdit = !!application;
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTypeId, setJobTypeId] = useState<string>(NONE);
  const [dateApplied, setDateApplied] = useState("");
  const [postingUrl, setPostingUrl] = useState("");

  const companies = useCompanies();
  const jobTypes = useJobTypes();
  const create = useCreateJobApplication();
  const update = useUpdateJobApplication();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (isEdit && application) {
      setCompanyId(application.company_id);
      setJobTitle(application.job_title);
      setJobTypeId(application.job_type_id ?? NONE);
      setDateApplied(application.date_applied ?? "");
      setPostingUrl(application.job_posting_url ?? "");
    } else {
      setCompanyId("");
      setJobTitle("");
      setJobTypeId(NONE);
      setDateApplied("");
      setPostingUrl("");
    }
  }, [open, isEdit, application]);

  const submit = () => {
    if (!companyId || !jobTitle.trim()) return;
    const input = {
      company_id: companyId,
      job_title: jobTitle.trim(),
      job_type_id: jobTypeId === NONE ? null : jobTypeId,
      date_applied: dateApplied || null,
      job_posting_url: postingUrl.trim() || null,
    };
    const onSuccess = () => {
      setOpen(false);
      toast({ title: isEdit ? "Application updated" : "Application created", variant: "success" });
    };
    const onError = (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" });

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
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {(companies.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="application-date-applied">Date Applied</Label>
              <Input id="application-date-applied" type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="application-posting-url">Job Posting URL</Label>
              <Input id="application-posting-url" value={postingUrl} onChange={(e) => setPostingUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
