import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Ticket as TicketIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  isDelayed,
  isStaff,
  priorityTone,
  statusTone,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/helpdesk";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tickets · HelpDesk Lite" },
      { name: "description", content: "Track, assign, and resolve internal support tickets." },
      { property: "og:title", content: "Tickets · HelpDesk Lite" },
      { property: "og:description", content: "Track, assign, and resolve internal support tickets." },
    ],
  }),
  component: Dashboard,
});

export type TicketRow = {
  id: string;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  requester_id: string;
  assignee_id: string | null;
  created_at: string;
};

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });
}

function Dashboard() {
  const { user } = useSession();
  const { roles, loading: rolesLoading } = useRoles(user?.id);
  const staff = isStaff(roles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const tickets = useQuery({
    queryKey: ["tickets"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, ticket_number, title, status, priority, category, requester_id, assignee_id, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TicketRow[];
    },
  });

  const profiles = useProfiles();
  const nameOf = useMemo(() => {
    const map = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name || p.email]));
    return (id: string | null) => (id ? (map.get(id) ?? "Unknown") : "Unassigned");
  }, [profiles.data]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tickets-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        tickets.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const rows = (tickets.data ?? []).filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {staff ? "All support tickets" : "My support requests"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {staff
              ? "Review, assign, and move tickets through the workflow."
              : "Submit a request and follow its progress until it is resolved."}
          </p>
        </div>
        <Button asChild>
          <Link to="/tickets/new">
            <Plus className="size-4" /> New request
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title or ticket ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tickets.isLoading || rolesLoading ? (
        <p className="text-sm text-muted-foreground">Loading tickets…</p>
      ) : rows.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <TicketIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
            <Button asChild variant="secondary">
              <Link to="/tickets/new">Submit the first request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Submitter</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/tickets/$ticketId"
                      params={{ ticketId: t.id }}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t.ticket_number}</span>
                      {isDelayed(t) && (
                        <Badge variant="outline" className="border-destructive/30 text-destructive">
                          Delayed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusTone(t.status)}>
                      {STATUS_LABELS[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={priorityTone(t.priority)}>
                      {PRIORITY_LABELS[t.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{nameOf(t.requester_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{nameOf(t.assignee_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
