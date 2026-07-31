import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, type Role } from "@/lib/helpdesk";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "People & roles · HelpDesk Lite" },
      {
        name: "description",
        content: "Managers promote users to support staff or manager and manage HelpDesk permissions.",
      },
      { property: "og:title", content: "People & roles · HelpDesk Lite" },
      {
        property: "og:description",
        content: "Managers promote users to support staff or manager and manage HelpDesk permissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Team,
});

const ROLE_ORDER: Role[] = ["employee", "support", "manager"];

const PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: "Submit a support request", roles: ["employee", "support", "manager"] },
  { label: "View own tickets", roles: ["employee", "support", "manager"] },
  { label: "View all tickets", roles: ["support", "manager"] },
  { label: "Assign tickets & update status", roles: ["support", "manager"] },
  { label: "View workload insights", roles: ["support", "manager"] },
  { label: "Manage people & roles", roles: ["manager"] },
];

function Team() {
  const { user } = useSession();
  const { roles, loading } = useRoles(user?.id);
  const isManager = roles.includes("manager");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const people = useQuery({
    queryKey: ["team-people"],
    enabled: isManager,
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: userRoles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (userRoles ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as Role),
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(`Role updated to ${ROLE_LABELS[v.role]}`);
      queryClient.invalidateQueries({ queryKey: ["team-people"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isManager)
    return (
      <p className="text-sm text-muted-foreground">
        People &amp; roles is available to managers only.
      </p>
    );

  const term = search.trim().toLowerCase();
  const rows = (people.data ?? []).filter(
    (p) =>
      !term ||
      p.email.toLowerCase().includes(term) ||
      (p.full_name ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People &amp; roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promote users to Support Staff or Manager. Each person holds exactly one role.
        </p>
      </div>

      <Card className="shadow-panel">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Members</CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {people.isLoading && <p className="text-sm text-muted-foreground">Loading members…</p>}
          {!people.isLoading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No members found.</p>
          )}
          {rows.map((p) => {
            const current: Role = p.roles.includes("manager")
              ? "manager"
              : p.roles.includes("support")
                ? "support"
                : "employee";
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.full_name || p.email}
                    {p.id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                </div>
                <Badge variant="secondary">{ROLE_LABELS[current]}</Badge>
                <div className="flex gap-1">
                  {ROLE_ORDER.map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={r === current ? "default" : "outline"}
                      disabled={r === current || setRole.isPending}
                      onClick={() => setRole.mutate({ userId: p.id, role: r })}
                    >
                      {ROLE_LABELS[r]}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Permission matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">Capability</th>
                  {ROLE_ORDER.map((r) => (
                    <th key={r} className="py-2 pl-4 font-medium">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.label} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{perm.label}</td>
                    {ROLE_ORDER.map((r) => (
                      <td key={r} className="py-2 pl-4 text-muted-foreground">
                        {perm.roles.includes(r) ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
