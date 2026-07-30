import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
      { name: "description", content: "Manager view of open tickets, delays, and workload per support member." },
      { property: "og:title", content: "Insights · HelpDesk Lite" },
      { property: "og:description", content: "Manager view of open tickets, delays, and workload per support member." },
    ],
  }),
  component: Insights;
});

function Insights() {
  return null;
}
