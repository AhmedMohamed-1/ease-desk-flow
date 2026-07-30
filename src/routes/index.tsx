import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GaugeCircle,
  LifeBuoy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_TRANSITIONS, type TicketStatus } from "@/lib/helpdesk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HelpDesk Lite — Internal Support Ticketing" },
      {
        name: "description",
        content:
          "Submit, assign, track, and resolve internal support requests with clear ownership and manager visibility.",
      },
      { property: "og:title", content: "HelpDesk Lite — Internal Support Ticketing" },
      {
        property: "og:description",
        content:
          "Submit, assign, track, and resolve internal support requests with clear ownership and manager visibility.",
      },
    ],
  }),
  component: Landing,
});

const permissions = [
  {
    role: "Employee",
    icon: ClipboardList,
    items: [
      "View: only their own tickets",
      "Create: new support requests",
      "Update: nothing after submission",
      "Assign: no",
      "Resolve: no",
    ],
  },
  {
    role: "Support Staff",
    icon: Users,
    items: [
      "View: all tickets and details",
      "Create: tickets (own or on behalf)",
      "Update: status, priority, notes",
      "Assign: to self or another support member",
      "Resolve: yes — resolve and close",
    ],
  },
  {
    role: "Manager",
    icon: GaugeCircle,
    items: [
      "View: all tickets plus the insights dashboard",
      "Create: tickets",
      "Update: everything support staff can",
      "Assign: yes, including reassignment",
      "Resolve: yes, plus manage user roles",
    ],
  },
];

const fields = [
  { label: "Title", note: "Required · short summary, 5–120 characters" },
  { label: "Description", note: "Required · what happened and what was tried" },
  { label: "Category", note: "Required · Hardware, Software, Network, Access, Facilities, Other" },
  { label: "Priority", note: "Required · Low, Medium, High, Urgent (drives the SLA)" },
  { label: "Submitter & ticket ID", note: "Automatic · captured on submission" },
  { label: "Attachments", note: "Out of scope for v1 — links can be pasted in the description" },
];

const metrics = [
  "Open tickets by status",
  "Delayed tickets (past the priority SLA)",
  "Resolved and closed volume",
  "Open workload per support member",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-semibold">
            <LifeBuoy className="size-5 text-primary" /> HelpDesk Lite
          </span>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Badge variant="secondary" className="mb-4">
            Internal support ticketing · v1
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            One place for every internal support request.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Employees submit requests with the information support actually needs. Support staff
            take ownership and move tickets through a clear workflow. Managers see open work,
            delays, and who is carrying the load.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {permissions.map((p) => (
                <Card key={p.role} className="shadow-panel">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <span className="rounded-lg bg-secondary p-2 text-primary">
                      <p.icon className="size-5" />
                    </span>
                    <CardTitle className="text-base">{p.role}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {p.items.map((i) => (
                        <li key={i} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Ticket workflow</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Initial status <strong>New</strong> · working statuses <strong>Assigned</strong>,{" "}
            <strong>In Progress</strong>, <strong>On Hold</strong> · final status{" "}
            <strong>Closed</strong> (with <strong>Resolved</strong> as the pre-closure state).
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
              <div key={s} className="rounded-xl border border-border bg-card p-4 shadow-panel">
                <p className="font-medium">{STATUS_LABELS[s]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {STATUS_TRANSITIONS[s].length
                    ? `Can move to: ${STATUS_TRANSITIONS[s].map((n) => STATUS_LABELS[n]).join(", ")}`
                    : "Final state — no further transitions"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Required ticket information</h2>
              <ul className="mt-5 space-y-3">
                {fields.map((f) => (
                  <li key={f.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.note}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Manager visibility</h2>
              <ul className="mt-5 space-y-3">
                {metrics.map((m) => (
                  <li key={m} className="flex gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Delay thresholds: Urgent 4h, High 8h, Medium 24h, Low 72h from submission while the
                ticket is still open.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        HelpDesk Lite — internal support ticketing workspace
      </footer>
    </div>
  );
}
