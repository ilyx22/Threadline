import {
  BarChart3,
  Boxes,
  Brain,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Flag,
  FolderOpen,
  Gauge,
  Grid2X2,
  BadgeCheck,
  Home,
  Inbox,
  Mic,
  LifeBuoy,
  Library,
  Lightbulb,
  Users,
  Radar,
  Route,
  ScrollText,
  Send,
  Settings,
  Signal,
  Sparkles,
  Stethoscope,
  Telescope,
  Video,
  Workflow, Timer } from "lucide-react";
import type { Capability } from "@/lib/auth/roles";

/**
 * Navigation definitions.
 *
 * One system, two experiences. Both are the same application, the same database
 * and the same tenancy — what differs is how much of the kitchen is on show.
 *
 * - `operatorNav` is the full loop: research, signals, cycles, the board, the
 *   pipeline. Threadline staff work here.
 * - `clientNav` is deliberately smaller. A client should open Threadline, see
 *   what needs them, do it, and close it again. Everything else is status.
 *
 * Each entry declares the capability required to see it, and the same capability
 * is enforced server-side on the route. Hiding an item is never the control —
 * `src/lib/auth/visibility.test.ts` asserts that the routes deny as well.
 */

export type Surface = "client" | "operator";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  capability: Capability;
  /** Sub-navigation rendered as tabs inside the section. */
  children?: { key: string; label: string; href: string; capability: Capability }[];
};

export function operatorNav(slug: string): NavItem[] {
  const base = `/app/${slug}`;
  return [
    {
      key: "home",
      label: "Home",
      href: base,
      icon: Home,
      capability: "workspace.view",
    },
    {
      key: "intelligence",
      label: "Intelligence",
      href: `${base}/intelligence`,
      icon: Brain,
      capability: "brain.view",
      children: [
        { key: "brain", label: "Brand Brain", href: `${base}/intelligence`, capability: "brain.view" },
        {
          key: "runs",
          label: "Intelligence",
          href: `${base}/intelligence/runs`,
          capability: "research.view",
        },
        {
          key: "diagnosis",
          label: "Diagnosis",
          href: `${base}/intelligence/diagnosis`,
          capability: "diagnosis.view",
        },
        { key: "radar", label: "Market Radar", href: `${base}/intelligence/radar`, capability: "research.view" },
        { key: "signals", label: "Signals", href: `${base}/intelligence/signals`, capability: "signals.view" },
      ],
    },
    {
      key: "create",
      label: "Create",
      href: `${base}/create`,
      icon: Lightbulb,
      capability: "ideas.view",
      children: [
        { key: "ideas", label: "Ideas", href: `${base}/create`, capability: "ideas.view" },
        { key: "scripts", label: "Scripts", href: `${base}/create/scripts`, capability: "scripts.view" },
      ],
    },
    {
      key: "production",
      label: "Production",
      href: `${base}/production`,
      icon: Video,
      capability: "production.view",
      children: [
        { key: "board", label: "Board", href: `${base}/production`, capability: "production.view" },
        {
          key: "recording",
          label: "Recording Room",
          href: `${base}/production/recording`,
          capability: "recording.view",
        },
        {
          key: "packaging",
          label: "Packaging",
          href: `${base}/production/packaging`,
          capability: "distribution.view",
        },
      ],
    },
    {
      key: "distribution",
      label: "Distribution",
      href: `${base}/distribution`,
      icon: Send,
      capability: "distribution.view",
    },
    {
      key: "performance",
      label: "Performance",
      href: `${base}/performance`,
      icon: BarChart3,
      capability: "performance.view",
      children: [
        { key: "overview", label: "Overview", href: `${base}/performance`, capability: "performance.view" },
        {
          key: "attribution",
          label: "Attribution",
          href: `${base}/performance/attribution`,
          capability: "attribution.manage",
        },
        { key: "proof", label: "Proof", href: `${base}/performance/proof`, capability: "proof.view" },
        { key: "learning", label: "Learning", href: `${base}/learning`, capability: "learning.view" },
        { key: "reports", label: "Reports", href: `${base}/reports`, capability: "reports.view" },
      ],
    },
    {
      key: "pipeline",
      label: "Pipeline",
      href: `${base}/pipeline`,
      icon: Workflow,
      capability: "pipeline.view",
    },
    {
      key: "library",
      label: "Library",
      href: `${base}/library`,
      icon: FolderOpen,
      capability: "library.view",
    },
    {
      key: "settings",
      label: "Settings",
      href: `${base}/settings`,
      icon: Settings,
      capability: "workspace.view",
      children: [
        { key: "workspace", label: "Workspace", href: `${base}/settings`, capability: "workspace.view" },
        { key: "members", label: "Members", href: `${base}/settings/members`, capability: "workspace.view" },
        {
          key: "integrations",
          label: "Integrations",
          href: `${base}/settings/integrations`,
          capability: "workspace.view",
        },
        { key: "billing", label: "Billing", href: `${base}/settings/billing`, capability: "billing.view" },
      ],
    },
  ];
}

/**
 * The client experience.
 *
 * Ordered by what a founder actually does, not by what the system contains:
 * what needs me, record it, approve it, then everything else as status.
 */
export function clientNav(slug: string): NavItem[] {
  const base = `/app/${slug}`;
  return [
    {
      key: "home",
      label: "This week",
      href: base,
      icon: Home,
      capability: "workspace.view",
    },
    {
      key: "recording",
      label: "Recording",
      href: `${base}/production/recording`,
      icon: Mic,
      capability: "recording.view",
      children: [
        {
          key: "room",
          label: "Recording Room",
          href: `${base}/production/recording`,
          capability: "recording.view",
        },
        {
          key: "setup",
          label: "Your setup",
          href: `${base}/install/recording`,
          capability: "recording.view",
        },
      ],
    },
    {
      key: "approvals",
      label: "Approvals",
      href: `${base}/approvals`,
      icon: BadgeCheck,
      capability: "workspace.view",
    },
    {
      key: "content",
      label: "Content",
      href: `${base}/production`,
      icon: Video,
      capability: "production.view",
      children: [
        { key: "board", label: "In production", href: `${base}/production`, capability: "production.view" },
        {
          key: "distribution",
          label: "Scheduled",
          href: `${base}/distribution`,
          capability: "distribution.view",
        },
        { key: "library", label: "Library", href: `${base}/library`, capability: "library.view" },
      ],
    },
    {
      key: "intelligence",
      label: "Intelligence",
      href: `${base}/intelligence/runs`,
      icon: Telescope,
      capability: "workspace.view",
      children: [
        {
          key: "briefs",
          label: "Briefs",
          href: `${base}/intelligence/runs`,
          capability: "workspace.view",
        },
        {
          key: "diagnosis",
          label: "Diagnosis",
          href: `${base}/intelligence/diagnosis`,
          capability: "diagnosis.view",
        },
        { key: "brain", label: "Brand Brain", href: `${base}/intelligence`, capability: "brain.view" },
      ],
    },
    {
      key: "results",
      label: "Results",
      href: `${base}/performance`,
      icon: BarChart3,
      capability: "performance.view",
      children: [
        {
          key: "learning",
          label: "What we are learning",
          href: `${base}/learning`,
          capability: "learning.view",
        },
        { key: "overview", label: "Overview", href: `${base}/performance`, capability: "performance.view" },
        { key: "proof", label: "Proof", href: `${base}/performance/proof`, capability: "proof.view" },
        { key: "pipeline", label: "Pipeline", href: `${base}/pipeline`, capability: "pipeline.view" },
      ],
    },
    {
      key: "reports",
      label: "Reports",
      href: `${base}/reports`,
      icon: FileText,
      capability: "reports.view",
    },
    {
      key: "settings",
      label: "Settings",
      href: `${base}/settings`,
      icon: Settings,
      capability: "workspace.view",
      children: [
        { key: "workspace", label: "Workspace", href: `${base}/settings`, capability: "workspace.view" },
        { key: "members", label: "People", href: `${base}/settings/members`, capability: "workspace.view" },
        {
          key: "access",
          label: "Access",
          href: `${base}/settings/integrations`,
          capability: "workspace.view",
        },
        { key: "billing", label: "Billing", href: `${base}/settings/billing`, capability: "billing.view" },
      ],
    },
  ];
}

/** The nav for a surface. The one place the two experiences diverge. */
export function workspaceNav(slug: string, surface: Surface): NavItem[] {
  return surface === "operator" ? operatorNav(slug) : clientNav(slug);
}

/** Secondary destinations reachable from the top bar rather than the sidebar. */
export function clientQuickNav(slug: string) {
  return [
    { key: "tasks", label: "Tasks", href: `/app/${slug}/tasks`, icon: ClipboardList },
    { key: "reports", label: "Reports", href: `/app/${slug}/reports`, icon: FileText },
  ];
}

/**
 * The admin portal: Threadline running Threadline.
 *
 * Ordered by the operating day rather than by module. Today first, because the
 * question the founder opens the app with is "what matters now"; then the three
 * lanes that answer it — the market hypothesis being sold against, the
 * prospects moving through it, and the arithmetic that says how much activity
 * the target actually requires. Client delivery follows, because it is work
 * that already exists rather than work that has to be created.
 */
export const ADMIN_NAV: NavItem[] = [
  { key: "today", label: "Today", href: "/admin", icon: Gauge, capability: "admin.view" },
  {
    key: "market",
    label: "Market",
    href: "/admin/market",
    icon: Telescope,
    capability: "acquisition.view",
  },
  {
    key: "research",
    label: "Research",
    href: "/admin/research",
    icon: Library,
    capability: "corpus.manage",
  },
  {
    key: "prospects",
    label: "Prospects",
    href: "/admin/prospects",
    icon: Route,
    capability: "acquisition.view",
  },
  {
    key: "acquisition",
    label: "Acquisition",
    href: "/admin/acquisition",
    icon: Signal,
    capability: "acquisition.view",
  },
  {
    key: "clients",
    label: "Clients",
    href: "/admin/clients",
    icon: Building2,
    capability: "admin.clients.manage",
  },
  {
    key: "delivery",
    label: "Delivery load",
    href: "/admin/delivery",
    icon: Timer,
    capability: "admin.view",
  },
  {
    key: "scripts",
    label: "Scripts",
    href: "/admin/scripts",
    icon: ScrollText,
    capability: "admin.sops",
  },
  {
    key: "queue",
    label: "Operator queue",
    href: "/admin/queue",
    icon: Inbox,
    capability: "admin.view",
  },
  {
    key: "applications",
    label: "Applications",
    href: "/admin/applications",
    icon: Users,
    capability: "admin.applications",
  },
  {
    key: "support",
    label: "Support",
    href: "/admin/support",
    icon: LifeBuoy,
    capability: "admin.support",
  },
  { key: "sops", label: "SOPs", href: "/admin/sops", icon: ScrollText, capability: "admin.sops" },
  {
    key: "metrics",
    label: "Business metrics",
    href: "/admin/metrics",
    icon: BarChart3,
    capability: "admin.metrics",
  },
];

/**
 * Determine the active nav key from a pathname. Longest-prefix wins so
 * `/production/recording` highlights Production, not Home.
 */
export function activeNavKey(pathname: string, items: NavItem[]): string {
  let best = items[0]?.key ?? "";
  let bestLength = -1;

  for (const item of items) {
    const candidates = [item.href, ...(item.children?.map((c) => c.href) ?? [])];
    for (const href of candidates) {
      if (pathname === href || pathname.startsWith(href + "/")) {
        if (href.length > bestLength) {
          bestLength = href.length;
          best = item.key;
        }
      }
    }
  }
  return best;
}

export function activeChildHref(pathname: string, item: NavItem): string {
  if (!item.children) return item.href;
  let best = item.children[0]?.href ?? item.href;
  let bestLength = -1;
  for (const child of item.children) {
    if (pathname === child.href || pathname.startsWith(child.href + "/")) {
      if (child.href.length > bestLength) {
        bestLength = child.href.length;
        best = child.href;
      }
    }
  }
  return best;
}

/**
 * Command menu entries, built from the same definitions so nothing drifts.
 *
 * Takes the surface, so a client's command menu cannot navigate to an operator
 * route — which would put them on a page the server then denies, and make the
 * product feel broken rather than curated.
 */
export function commandTargets(slug: string, surface: Surface = "operator") {
  const base = `/app/${slug}`;
  if (surface === "client") {
    return [
      { label: "This week", href: base, icon: Home, group: "Navigate" },
      { label: "Recording Room", href: `${base}/production/recording`, icon: Video, group: "Navigate" },
      { label: "Approvals", href: `${base}/approvals`, icon: BadgeCheck, group: "Navigate" },
      { label: "Content", href: `${base}/production`, icon: Grid2X2, group: "Navigate" },
      { label: "Scheduled", href: `${base}/distribution`, icon: Calendar, group: "Navigate" },
      { label: "Library", href: `${base}/library`, icon: FolderOpen, group: "Navigate" },
      { label: "Intelligence briefs", href: `${base}/intelligence/runs`, icon: Telescope, group: "Navigate" },
      { label: "Diagnosis", href: `${base}/intelligence/diagnosis`, icon: Stethoscope, group: "Navigate" },
      { label: "Brand Brain", href: `${base}/intelligence`, icon: Brain, group: "Navigate" },
      { label: "Results", href: `${base}/performance`, icon: BarChart3, group: "Navigate" },
      { label: "Proof", href: `${base}/performance/proof`, icon: Gauge, group: "Navigate" },
      { label: "Pipeline", href: `${base}/pipeline`, icon: Workflow, group: "Navigate" },
      { label: "Reports", href: `${base}/reports`, icon: FileText, group: "Navigate" },
      { label: "Tasks", href: `${base}/tasks`, icon: ClipboardList, group: "Navigate" },
      { label: "Recording setup", href: `${base}/install/recording`, icon: Mic, group: "Navigate" },
      { label: "Installation", href: `${base}/install`, icon: Flag, group: "Navigate" },
      { label: "Settings", href: `${base}/settings`, icon: Settings, group: "Navigate" },
    ];
  }
  return [
    { label: "Home", href: base, icon: Home, group: "Navigate" },
    { label: "Brand Brain", href: `${base}/intelligence`, icon: Brain, group: "Navigate" },
    { label: "Market Radar", href: `${base}/intelligence/radar`, icon: Radar, group: "Navigate" },
    { label: "Intelligence briefs", href: `${base}/intelligence/runs`, icon: Telescope, group: "Navigate" },
    { label: "Constraint diagnosis", href: `${base}/intelligence/diagnosis`, icon: Stethoscope, group: "Navigate" },
    { label: "Signals", href: `${base}/intelligence/signals`, icon: Signal, group: "Navigate" },
    { label: "Ideas", href: `${base}/create`, icon: Lightbulb, group: "Navigate" },
    { label: "Scripts", href: `${base}/create/scripts`, icon: FileText, group: "Navigate" },
    { label: "Production board", href: `${base}/production`, icon: Grid2X2, group: "Navigate" },
    { label: "Recording Room", href: `${base}/production/recording`, icon: Video, group: "Navigate" },
    { label: "Packaging", href: `${base}/production/packaging`, icon: Boxes, group: "Navigate" },
    { label: "Distribution", href: `${base}/distribution`, icon: Calendar, group: "Navigate" },
    { label: "Performance", href: `${base}/performance`, icon: BarChart3, group: "Navigate" },
    { label: "Proof", href: `${base}/performance/proof`, icon: Gauge, group: "Navigate" },
    { label: "Installation", href: `${base}/install`, icon: Flag, group: "Navigate" },
    { label: "Recording setup", href: `${base}/install/recording`, icon: Mic, group: "Navigate" },
    { label: "Pipeline", href: `${base}/pipeline`, icon: Workflow, group: "Navigate" },
    { label: "Library", href: `${base}/library`, icon: FolderOpen, group: "Navigate" },
    { label: "Tasks", href: `${base}/tasks`, icon: ClipboardList, group: "Navigate" },
    { label: "Reports", href: `${base}/reports`, icon: FileText, group: "Navigate" },
    { label: "Settings", href: `${base}/settings`, icon: Settings, group: "Navigate" },
    {
      label: "Generate ideas",
      href: `${base}/create?generate=1`,
      icon: Sparkles,
      group: "Actions",
    },
    {
      label: "Capture research",
      href: `${base}/intelligence/radar?new=1`,
      icon: Radar,
      group: "Actions",
    },
    {
      label: "Start an intelligence run",
      href: `${base}/intelligence/runs?new=1`,
      icon: Telescope,
      group: "Actions",
    },
    {
      label: "Log a pipeline record",
      href: `${base}/pipeline?new=1`,
      icon: Workflow,
      group: "Actions",
    },
  ];
}
