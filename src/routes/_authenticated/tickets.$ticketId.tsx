import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  isStaff,
  priorityTone,
  statusTone,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/helpdesk";

export const Route = createFileRoute("/_authenticated/tickets/$ticketId")({
  head: () => ({
    meta: [
      { title: "Ticket details · HelpDesk Lite" },
      { name: "description", content: "View ownership, priority, and progress for a support ticket." },
      { property: "og:title", content: "Ticket details · HelpDesk Lite" },
      { property: "og:description", content: "View ownership, priority, and progress for a support ticket." },
    ],
  }),
  component: TicketDetail,
});

function TicketDetail() {
  const { ticketId } = Route.useParams();
  const { user } = useSession();
  const { roles } = useRoles(user?.id);
  const staff = isStaff(roles);
  const queryClient = useQueryClient();

  const ticket = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const staffMembers = useQuery({
    queryKey: ["staff-members"],
    enabled: staff,
    queryFn: async () => {
      const { data: roleRows, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["support", "manager"]);
      if (error) throw error;
      const ids = [...new Set((roleRows ?? []).map((r) => r.user_id))];
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      return profs ?? [];
    },
  });

  const people = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  async function update(patch: Record<string, unknown>, message: string) {
    const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
  }

  if (ticket.isLoading) return <p className="text-sm text-muted-foreground">Loading ticket…</p>;
  if (!ticket.data)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Ticket not found or not visible to you.</p>
        <Button asChild variant="secondary">
          <Link to="/dashboard">Back to tickets</Link>
        </Button>
      </div>
    );

  const t = ticket.data;
  const status = t.status as TicketStatus;
  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = (people.data ?? []).find((x) => x.id === id);
    return p ? p.full_name || p.email : "Unknown";
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" /> Back to tickets
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-panel lg:col-span-2">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{t.ticket_number}</span>
              <Badge variant="outline" className={statusTone(status)}>
                {STATUS_LABELS[status]}
              </Badge>
              <Badge variant="outline" className={priorityTone(t.priority as TicketPriority)}>
                {PRIORITY_LABELS[t.priority as TicketPriority]}
              </Badge>
              <Badge variant="secondary">{CATEGORY_LABELS[t.category as TicketCategory]}</Badge>
            </div>
            <CardTitle className="text-xl">{t.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {t.description}
            </p>
            <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Submitted by</dt>
                <dd>{nameOf(t.requester_id)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Submitted on</dt>
                <dd>{new Date(t.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Assignee</dt>
                <dd>{nameOf(t.assignee_id)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Resolved</dt>
                <dd>{t.resolved_at ? new Date(t.resolved_at).toLocaleString() : "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-panel">
          <CardHeader>
            <CardTitle className="text-base">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {staff ? (
              <>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={t.assignee_id ?? "unassigned"}
                    onValueChange={(v) =>
                      update(
                        {
                          assignee_id: v === "unassigned" ? null : v,
                          ...(v !== "unassigned" && status === "new" ? { status: "assigned" } : {}),
                        },
                        "Assignee updated",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(staffMembers.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name || m.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user && t.assignee_id !== user.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        update(
                          {
                            assignee_id: user.id,
                            ...(status === "new" ? { status: "assigned" } : {}),
                          },
                          "Ticket assigned to you",
                        )
                      }
                    >
                      Assign to me
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => update({ status: v }, `Status set to ${STATUS_LABELS[v as TicketStatus]}`)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={status}>{STATUS_LABELS[status]} (current)</SelectItem>
                      {STATUS_TRANSITIONS[status].map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only transitions allowed by the workflow are listed.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Support staff will assign an owner and update the status here. You'll see progress
                on this page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
