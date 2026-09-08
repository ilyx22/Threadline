"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/button";

export function MarketingNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[13px] transition-colors",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <IconButton
        icon={open ? X : Menu}
        label={open ? "Close menu" : "Open menu"}
        className="ml-auto md:hidden"
        onClick={() => setOpen((v) => !v)}
      />

      {open ? (
        <div className="absolute left-0 right-0 top-16 border-b border-line bg-base p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-[14px] text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-[14px] text-muted transition-colors hover:bg-raised hover:text-ink"
            >
              Sign in
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
