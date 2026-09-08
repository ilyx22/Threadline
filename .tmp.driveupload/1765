"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/data";
import { commandTargets, type Surface } from "@/lib/navigation";
import type { SearchResult } from "@/lib/data/workspace";

/**
 * Command menu (Cmd/Ctrl-K).
 *
 * Combines static navigation targets with live workspace search. Search results
 * come from a server action scoped to the current organisation, so the menu can
 * never surface another tenant's records.
 */
export function CommandMenu({
  slug,
  surface,
  search,
}: {
  slug: string;
  surface: Surface;
  search: (query: string) => Promise<SearchResult[]>;
}) {
  const router = useRouter();
  // Built here rather than passed in: the entries carry icon components, which
  // cannot cross the server/client boundary.
  const targets = React.useMemo(() => commandTargets(slug, surface), [slug, surface]);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced workspace search.
  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await search(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query, open, search]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setIndex(0);
    }
  }, [open]);

  const filteredTargets = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter((t) => t.label.toLowerCase().includes(q));
  }, [query, targets]);

  const rows = React.useMemo(
    () => [
      ...filteredTargets.map((t) => ({
        kind: "target" as const,
        key: t.href,
        label: t.label,
        group: t.group,
        icon: t.icon,
        href: t.href,
        subtitle: undefined as string | undefined,
      })),
      ...results.map((r) => ({
        kind: "result" as const,
        key: `${r.type}-${r.id}`,
        label: r.title,
        group: r.type,
        icon: undefined,
        href: r.href,
        subtitle: r.subtitle,
      })),
    ],
    [filteredTargets, results],
  );

  React.useEffect(() => {
    setIndex(0);
  }, [rows.length]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[index];
      if (row) go(row.href);
    }
  };

  // Keep the highlighted row in view during keyboard navigation.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  let lastGroup = "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-faint transition-colors hover:border-line-strong hover:text-muted md:inline-flex"
      >
        <Search className="size-3.5" aria-hidden />
        <span>Search</span>
        <Kbd className="ml-2">⌘K</Kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" hideClose className="top-[20%] translate-y-0 p-0">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-faint" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search ideas, scripts, content, research…"
              aria-label="Search"
              className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ghost"
            />
            {searching ? <Loader2 className="size-4 animate-spin text-faint" aria-hidden /> : null}
          </div>

          <div ref={listRef} className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2">
            {rows.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-faint">
                {query.trim().length >= 2
                  ? "Nothing matched that search."
                  : "Type to search, or pick a destination."}
              </p>
            ) : (
              rows.map((row, i) => {
                const showGroup = row.group !== lastGroup;
                lastGroup = row.group;
                const Icon = row.icon;
                return (
                  <React.Fragment key={row.key}>
                    {showGroup ? (
                      <p className="text-eyebrow px-3 pb-1 pt-3 text-ghost first:pt-1">{row.group}</p>
                    ) : null}
                    <button
                      type="button"
                      data-row={i}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => go(row.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-colors",
                        i === index ? "bg-raised text-ink" : "text-muted",
                      )}
                    >
                      {Icon ? <Icon className="size-3.5 shrink-0 text-faint" aria-hidden /> : null}
                      <span className="flex-1 truncate">{row.label}</span>
                      {row.subtitle ? (
                        <span className="shrink-0 text-[11px] text-ghost">{row.subtitle}</span>
                      ) : null}
                      {i === index ? (
                        <CornerDownLeft className="size-3 shrink-0 text-ghost" aria-hidden />
                      ) : null}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ghost">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> open
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd> close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
