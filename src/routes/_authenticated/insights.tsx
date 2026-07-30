import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Inbox, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OPEN_STATUSES,
  STATUS_LABELS,
  isDelayed,
  isStaff,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/helpdesk";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights · HelpDesk Lite" },
      {
        name: "description",
        content: "Manager view of open tickets, delays, and workload per support member.",
      },
      { property: "og:title", content: "Insights · HelpDesk Lite" },
      {
        property: "og:description",
        content: "Manager view of open tickets, delays, and workload per support member.",
      },
    ],
  }),
  component: Insights,
});

type Row = {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

function Insights() {
  const { user } = useSession();
  const { roles, loading } = useRoles(user?.id);
  const staff = isStaff(roles);

  const tickets = useQuery({
    queryKey: ["tickets-insights"],
    enabled: staff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, status, priority, assignee_id, created_at, resolved_at");
      if (error) throw error;
      return data as Row[];
    },
  });

  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!staff)
    return (
      <p className="text-sm text-muted-foreground">
        Insights are available to support staff and managers only.
      </p>
    );

  const rows = tickets.data ?? [];
  const open = rows.filter((t) => OPEN_STATUSES.includes(t.status));
  const delayed = open.filter(isDelayed);
  const resolved = rows.filter((t) => t.status === "resolved" || t.status === "closed");

  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = (profiles.data ?? []).find((x) => x.id === id);
    return p ? p.full_name || p.email : "Unknown";
  };

  const workload = new Map<string | null, number>();
  for (const t of open) workload.set(t.assignee_id, (workload.get(t.assignee_id) ?? 0) + 1);
  const workloadRows = [...workload.entries()].sort((a, b) => b[1] - a[1]);

  const byStatus = Object.keys(STATUS_LABELS).map((s) => ({
    status: s as TicketStatus,
    count: rows.filter((t) => t.status === s).length,
  }));

  const metrics = [
    { label: "Open tickets", value: open.length, icon: Inbox },
    { label: "Delayed (past SLA)", value: delayed.length, icon: AlertTriangle },
    { label: "Resolved / closed", value: resolved.length, icon: CheckCircle2 },
    { label: "Support members with work", value: workloadRows.filter((w) => w[0]).length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workload &amp; visibility</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Delays are measured against the SLA for each priority: urgent 4h, high 8h, medium 24h,
          low 72h.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="shadow-panel">
            <CardContent className="flex items-center gap-4 py-6">
              <span className="rounded-lg bg-secondary p-2 text-primary">
                <m.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="text-base">Open workload per support member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workloadRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No open tickets.</p>
            )}
            {workloadRows.map(([id, count]) => (
              <div key={id ?? "unassigned"} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{nameOf(id)}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.round((count / Math.max(...workloadRows.map((w) => w[1]))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="text-base">Tickets by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byStatus.map((s) => (
              <div key={s.status} className="flex justify-between border-b border-border py-1.5 text-sm last:border-0">
                <span>{STATUS_LABELS[s.status]}</span>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
