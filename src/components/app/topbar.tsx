"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  ExternalLink,
  KeyRound,
  LogOut,
  Menu,
  Play,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/data";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { LinkTabs } from "@/components/ui/tabs";
import { relativeTime } from "@/lib/utils/dates";
import { activeChildHref, activeNavKey, workspaceNav, type Surface } from "@/lib/navigation";
import { LogoLink } from "@/components/brand/logo";
import { MobileNav } from "./sidebar";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  severity: string;
  readAt: Date | null;
  createdAt: Date;
};

export function TopBar({
  navKeys,
  surface,
  user,
  orgSlug,
  roleLabel,
  isInternal,
  notifications,
  unreadCount,
  taskCount,
  onMarkRead,
  onLogout,
  commandMenu,
  tourControl,
}: {
  /** See the note on Sidebar: keys cross the boundary, icons do not. */
  navKeys: string[];
  surface: Surface;
  user: { name: string; email: string; avatarHue: number; title: string | null };
  orgSlug: string;
  roleLabel: string;
  isInternal: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  taskCount: number;
  onMarkRead: () => Promise<void>;
  onLogout: () => Promise<void>;
  commandMenu: React.ReactNode;
  tourControl?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const items = React.useMemo(
    () => workspaceNav(orgSlug, surface).filter((item) => navKeys.includes(item.key)),
    [orgSlug, navKeys, surface],
  );
  const activeKey = activeNavKey(pathname, items);
  const activeItem = items.find((i) => i.key === activeKey);
  const subTabs = activeItem?.children;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-base/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 rounded-md p-2 text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
          >
            <Menu className="size-4.5" />
          </button>

          <div className="lg:hidden">
            <LogoLink href={`/app/${orgSlug}`} size="sm" />
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-[13px] font-medium text-muted">
              {activeItem?.label ?? "Threadline"}
            </p>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
            {tourControl}
            {commandMenu}

            <Link
              href={`/app/${orgSlug}/tasks`}
              className="relative hidden rounded-md p-2 text-faint transition-colors hover:bg-raised hover:text-ink sm:block"
              aria-label={`Tasks${taskCount > 0 ? ` (${taskCount} open)` : ""}`}
            >
              <ClipboardList className="size-4" />
              {taskCount > 0 ? (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-accent" aria-hidden />
              ) : null}
            </Link>

            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={onMarkRead}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} hue={user.avatarHue} size="md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2.5 pb-2 pt-1.5">
                  <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
                  <p className="truncate text-[11px] text-faint">{user.email}</p>
                  <Badge tone="outline" className="mt-2">
                    {roleLabel}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild icon={Settings}>
                  <Link href={`/app/${orgSlug}/settings`}>Workspace settings</Link>
                </DropdownMenuItem>
                {isInternal ? (
                  <DropdownMenuItem asChild icon={ShieldCheck}>
                    <Link href="/admin">Threadline admin</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild icon={KeyRound}>
                  <Link href="/account">Account security</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={LogOut} destructive onSelect={() => void onLogout()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {subTabs && subTabs.length > 1 ? (
          <div className="px-4 lg:px-6">
            <LinkTabs
              items={subTabs.map((t) => ({ href: t.href, label: t.label }))}
              activeHref={activeChildHref(pathname, activeItem)}
              className="border-b-0"
            />
          </div>
        ) : null}
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-line bg-surface shadow-pop">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <LogoLink href={`/app/${orgSlug}`} size="sm" />
              <IconButton icon={X} label="Close" onClick={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <MobileNav
                navKeys={navKeys}
                surface={surface}
                currentSlug={orgSlug}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && unreadCount > 0) void onMarkRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-md p-2 text-faint transition-colors hover:bg-raised hover:text-ink"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-accent" aria-hidden />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-ink">Notifications</p>
          {unreadCount > 0 ? (
            <span className="text-[11px] text-faint">{unreadCount} unread</span>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3.5 py-8 text-center text-[12px] text-faint">
              Nothing new. Alerts about approvals, recordings and reports appear here.
            </p>
          ) : (
            notifications.map((n) => {
              const body = (
                <div
                  className={cn(
                    "flex gap-2.5 border-b border-line px-3.5 py-2.5 last:border-0",
                    !n.readAt && "bg-accent-soft/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.severity === "critical"
                        ? "bg-negative"
                        : n.severity === "warning"
                          ? "bg-warning"
                          : n.severity === "success"
                            ? "bg-positive"
                            : "bg-faint",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-snug text-ink">{n.title}</p>
                    {n.body ? (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{n.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ghost">{relativeTime(n.createdAt)}</p>
                  </div>
                  {n.href ? (
                    <ExternalLink className="mt-1 size-3 shrink-0 text-ghost" aria-hidden />
                  ) : null}
                </div>
              );

              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block">
                  {body}
                </Link>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Discreet demo tour trigger, shown in the top bar. */
export function TourTrigger({ onStart }: { onStart: () => void }) {
  return (
    <Button variant="ghost" size="sm" icon={Play} onClick={onStart} className="hidden md:inline-flex">
      Demo tour
    </Button>
  );
}
