"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogoLink } from "@/components/brand/logo";
import { activeNavKey, workspaceNav, type Surface } from "@/lib/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Tooltip,
} from "@/components/ui/menu";
import { Badge } from "@/components/ui/badge";

export type OrgOption = { id: string; slug: string; name: string; status: string };

export function Sidebar({
  navKeys,
  surface,
  orgs,
  currentSlug,
  currentName,
  roleLabel,
  counts,
}: {
  /**
   * Only the permitted nav KEYS cross the server/client boundary. Icon
   * components are not serialisable, so the client rebuilds the full nav from
   * the shared definition and filters it — one definition, no serialisation.
   */
  navKeys: string[];
  /** Which experience this is. The client and operator navs differ. */
  surface: Surface;
  orgs: OrgOption[];
  currentSlug: string;
  currentName: string;
  roleLabel: string;
  counts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const items = React.useMemo(
    () => workspaceNav(currentSlug, surface).filter((item) => navKeys.includes(item.key)),
    [currentSlug, navKeys, surface],
  );
  const active = activeNavKey(pathname, items);
  const [collapsed, setCollapsed] = React.useState(false);

  // Collapse preference is a per-viewer convenience, not shared state.
  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("tl.sidebar.collapsed") === "1");
    } catch {
      /* storage can be unavailable; the default is fine */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tl.sidebar.collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[236px]",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-line", collapsed ? "justify-center px-2" : "px-4")}>
        {collapsed ? (
          <LogoLink href={`/app/${currentSlug}`} size="sm" showMark />
        ) : (
          <LogoLink href={`/app/${currentSlug}`} size="sm" />
        )}
      </div>

      {/* Workspace switcher */}
      {orgs.length > 0 ? (
        <div className={cn("border-b border-line", collapsed ? "p-2" : "p-3")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={orgs.length <= 1}>
              <button
                type="button"
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-md border border-line bg-elevated text-left transition-colors",
                  orgs.length > 1 && "hover:border-line-strong hover:bg-raised",
                  collapsed ? "justify-center p-2" : "px-2.5 py-2",
                )}
              >
                <span
                  className="grid size-6 shrink-0 place-items-center rounded bg-accent-soft text-[11px] font-semibold text-accent"
                  aria-hidden
                >
                  {currentName.slice(0, 1).toUpperCase()}
                </span>
                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {currentName}
                      </span>
                      <span className="block truncate text-[11px] text-faint">{roleLabel}</span>
                    </span>
                    {orgs.length > 1 ? (
                      <ChevronsUpDown className="size-3.5 shrink-0 text-faint" aria-hidden />
                    ) : null}
                  </>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {orgs.map((org) => (
                <DropdownMenuItem key={org.id} asChild>
                  <Link href={`/app/${org.slug}`} className="flex items-center gap-2">
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.slug === currentSlug ? (
                      <Check className="size-3.5 text-accent" aria-hidden />
                    ) : org.status !== "active" ? (
                      <Badge tone="outline">{org.status}</Badge>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          const count = counts?.[item.key];

          const link = (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors",
                collapsed ? "justify-center p-2.5" : "px-2.5 py-2",
                isActive ? "bg-raised text-ink" : "text-faint hover:bg-raised/60 hover:text-muted",
              )}
            >
              {/* The accent appears only on the active item. */}
              {isActive ? (
                <span
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-current")}
                aria-hidden
              />
              {!collapsed ? (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {count ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] tabular",
                        isActive ? "bg-accent-soft text-accent" : "bg-elevated text-faint",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.key} content={item.label} side="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div className={cn("border-t border-line py-2", collapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md py-2 text-[12px] text-faint transition-colors hover:bg-raised hover:text-muted",
            collapsed ? "justify-center" : "px-2.5",
          )}
        >
          {collapsed ? (
            <PanelLeft className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/** Mobile navigation drawer, rendered from the top bar. */
export function MobileNav({
  navKeys,
  surface,
  currentSlug,
  onNavigate,
}: {
  navKeys: string[];
  surface: Surface;
  currentSlug: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const items = React.useMemo(
    () => workspaceNav(currentSlug, surface).filter((item) => navKeys.includes(item.key)),
    [currentSlug, navKeys, surface],
  );
  const active = activeNavKey(pathname, items);

  return (
    <nav className="space-y-0.5 p-3">
      {items.map((item) => {
        const isActive = item.key === active;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-raised text-ink" : "text-muted hover:bg-raised/60",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-faint")}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-3 border-t border-line pt-3">
        <Link
          href={`/app/${currentSlug}/tasks`}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-raised/60"
        >
          Tasks
        </Link>
      </div>
    </nav>
  );
}
