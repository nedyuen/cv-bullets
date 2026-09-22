import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  useJobTypes,
  useCreateJobType,
  useUpdateJobType,
  useCompetencies,
  useCreateCompetency,
  useUpdateCompetency,
  useTags,
} from "@/hooks/useSettings";
import type { JobType, Competency } from "@/types/database";

function NameManagerCard<T extends { id: string; name: string; status: "active" | "archived" }>({
  items,
  onCreate,
  onToggleStatus,
  placeholder,
}: {
  items: T[];
  onCreate: (name: string) => void;
  onToggleStatus: (item: T) => void;
  placeholder: string;
}) {
  const [name, setName] = useState("");

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onCreate(name.trim());
            setName("");
          }}
        >
          <Input placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
        <div className="divide-y rounded-md border">
          {items.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing here yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm">{item.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <Button size="sm" variant="outline" onClick={() => onToggleStatus(item)}>
                  {item.status === "active" ? "Archive" : "Restore"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const { toast } = useToast();

  const jobTypes = useJobTypes(true);
  const createJobType = useCreateJobType();
  const updateJobType = useUpdateJobType();

  const competencies = useCompetencies(true);
  const createCompetency = useCreateCompetency();
  const updateCompetency = useUpdateCompetency();

  const tags = useTags();

  return (
    <div>
      <PageHeader title="Settings" description="Manage Job Types, Competencies and view Tags." />
      <Tabs defaultValue="jobTypes">
        <TabsList>
          <TabsTrigger value="jobTypes">Job Types</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="jobTypes">
          <NameManagerCard<JobType>
            items={jobTypes.data ?? []}
            placeholder="New Job Type, e.g. AI Transformation"
            onCreate={(name) =>
              createJobType.mutate(name, {
                onError: (e) => toast({ title: "Couldn't create Job Type", description: e.message, variant: "destructive" }),
              })
            }
            onToggleStatus={(item) =>
              updateJobType.mutate({ id: item.id, status: item.status === "active" ? "archived" : "active" })
            }
          />
        </TabsContent>

        <TabsContent value="competencies">
          <NameManagerCard<Competency>
            items={competencies.data ?? []}
            placeholder="New Competency, e.g. Strategy"
            onCreate={(name) =>
              createCompetency.mutate(name, {
                onError: (e) => toast({ title: "Couldn't create Competency", description: e.message, variant: "destructive" }),
              })
            }
            onToggleStatus={(item) =>
              updateCompetency.mutate({ id: item.id, status: item.status === "active" ? "archived" : "active" })
            }
          />
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Tags are created freely from the Achievement form — this is a read-only list of tags in use.
              </p>
              <div className="flex flex-wrap gap-2">
                {(tags.data ?? []).map((t) => (
                  <span key={t.id} className="rounded-full border px-3 py-1 text-xs">
                    {t.name}
                  </span>
                ))}
                {tags.data?.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
