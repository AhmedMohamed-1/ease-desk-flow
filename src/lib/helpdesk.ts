export type Role = "employee" | "support" | "manager";
export type TicketStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory =
  | "hardware"
  | "software"
  | "network"
  | "access"
  | "facilities"
  | "other";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  on_hold: "On Hold",
  resolved: "Resolved",
  closed: "Closed",
};

/** Task 6 — allowed workflow transitions. */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ["assigned", "in_progress", "closed"],
  assigned: ["in_progress", "on_hold", "closed"],
  in_progress: ["on_hold", "resolved", "closed"],
  on_hold: ["in_progress", "closed"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

export const OPEN_STATUSES: TicketStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
];

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Task 7 — SLA used to flag delayed tickets, in hours. */
export const PRIORITY_SLA_HOURS: Record<TicketPriority, number> = {
  urgent: 4,
  high: 8,
  medium: 24,
  low: 72,
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  access: "Access & Accounts",
  facilities: "Facilities",
  other: "Other",
};

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  support: "Support Staff",
  manager: "Manager",
};

export function isStaff(roles: Role[]) {
  return roles.includes("support") || roles.includes("manager");
}

export function isDelayed(ticket: {
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
}) {
  if (!OPEN_STATUSES.includes(ticket.status)) return false;
  const ageHours =
    (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000;
  return ageHours > PRIORITY_SLA_HOURS[ticket.priority];
}

export function statusTone(status: TicketStatus) {
  switch (status) {
    case "new":
      return "bg-status-new/15 text-status-new border-status-new/30";
    case "assigned":
    case "in_progress":
      return "bg-status-active/15 text-status-active border-status-active/30";
    case "on_hold":
      return "bg-status-hold/15 text-status-hold border-status-hold/30";
    case "resolved":
      return "bg-status-done/15 text-status-done border-status-done/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function priorityTone(priority: TicketPriority) {
  switch (priority) {
    case "urgent":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "high":
      return "bg-status-hold/15 text-status-hold border-status-hold/30";
    case "medium":
      return "bg-status-active/15 text-status-active border-status-active/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
