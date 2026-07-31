import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LifeBuoy, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Role, isStaff } from "@/lib/helpdesk";
import { cn } from "@/lib/utils";

export function AppHeader({ roles, email }: { roles: Role[]; email?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const links = [
    { to: "/dashboard", label: "Tickets" },
    ...(isStaff(roles) ? [{ to: "/insights", label: "Insights" }] : []),
    ...(roles.includes("manager") ? [{ to: "/team", label: "People" }] : []),
  ];


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const topRole: Role = roles.includes("manager")
    ? "manager"
    : roles.includes("support")
      ? "support"
      : "employee";

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <LifeBuoy className="size-5 text-primary" />
          HelpDesk Lite
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary",
                pathname.startsWith(l.to) && "bg-secondary text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">{email}</p>
          <Badge variant="secondary">{ROLE_LABELS[topRole]}</Badge>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
