"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { ADMIN_NAV, activeNavKey } from "@/lib/navigation";

/**
 * Admin navigation. Receives permitted keys only — icon components cannot cross
 * the server/client boundary, so the definition is rebuilt here.
 */
export function AdminNav({ navKeys, queueCount }: { navKeys: string[]; queueCount: number }) {
  const pathname = usePathname();
  const items = React.useMemo(() => ADMIN_NAV.filter((i) => navKeys.includes(i.key)), [navKeys]);
  const active = activeNavKey(pathname, items);

  return (
    <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
      {items.map((item) => {
        const isActive = item.key === active;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
              isActive ? "bg-raised text-ink" : "text-faint hover:bg-raised/60 hover:text-muted",
            )}
          >
            <Icon
              className={cn("size-3.5", isActive ? "text-accent" : "text-current")}
              aria-hidden
            />
            <span className="hidden md:inline">{item.label}</span>
            {item.key === "queue" && queueCount > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular",
                  isActive ? "bg-accent-soft text-accent" : "bg-elevated text-faint",
                )}
              >
                {queueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminUserMenu({
  name,
  email,
  avatarHue,
  onLogout,
}: {
  name: string;
  email: string;
  avatarHue: number;
  onLogout: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Account menu"
        >
          <Avatar name={name} hue={avatarHue} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="truncate text-[13px] font-medium text-ink">{name}</p>
          <p className="truncate text-[11px] text-faint">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={LogOut} destructive onSelect={() => void onLogout()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
