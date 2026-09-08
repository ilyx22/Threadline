"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";

/**
 * URL-driven filters.
 *
 * Filtering happens on the server from search params, so a filtered view is a
 * shareable URL and the list never ships more rows to the client than it shows.
 * These controls only rewrite the query string.
 */

function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const setParam = React.useCallback(
    (key: string, values: string[] | string | null) => {
      const next = new URLSearchParams(params.toString());
      next.delete(key);
      if (Array.isArray(values)) {
        for (const v of values) next.append(key, v);
      } else if (values) {
        next.set(key, values);
      }
      // Any filter change resets pagination.
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const clearAll = React.useCallback(() => {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }, [pathname, router]);

  return { params, setParam, clearAll, pending };
}

export type FilterOption = { value: string; label: string; count?: number };

export function MultiFilter({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: FilterOption[];
}) {
  const { params, setParam } = useFilterState();
  const selected = params.getAll(name);

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    setParam(name, next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] transition-colors",
            selected.length > 0
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
          )}
        >
          {label}
          {selected.length > 0 ? (
            <span className="rounded-full bg-accent/20 px-1.5 text-[10px] tabular">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown className="size-3 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex-1">{option.label}</span>
            {option.count != null ? (
              <span className="ml-3 text-[11px] text-ghost">{option.count}</span>
            ) : null}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setParam(name, null)}>Clear</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SortFilter({
  options,
  name = "sort",
  defaultValue,
}: {
  options: FilterOption[];
  name?: string;
  defaultValue: string;
}) {
  const { params, setParam } = useFilterState();
  const current = params.get(name) ?? defaultValue;
  const label = options.find((o) => o.value === current)?.label ?? "Sort";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <span className="text-faint">Sort:</span>
          {label}
          <ChevronDown className="size-3 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => setParam(name, option.value)}>
            <span className="flex-1">{option.label}</span>
            {option.value === current ? (
              <Check className="size-3.5 text-accent" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterSearch({
  placeholder = "Search",
  name = "q",
  className,
}: {
  placeholder?: string;
  name?: string;
  className?: string;
}) {
  const { params, setParam } = useFilterState();
  const [value, setValue] = React.useState(params.get(name) ?? "");

  // Keep the input in sync when the URL changes from elsewhere (e.g. Clear all).
  React.useEffect(() => {
    setValue(params.get(name) ?? "");
  }, [params, name]);

  React.useEffect(() => {
    const current = params.get(name) ?? "";
    if (value === current) return;
    const timer = setTimeout(() => setParam(name, value || null), 260);
    return () => clearTimeout(timer);
  }, [value, params, name, setParam]);

  return (
    <SearchInput
      value={value}
      onValueChange={setValue}
      placeholder={placeholder}
      className={cn("w-full sm:w-64", className)}
    />
  );
}

/** Shows which filters are active and offers a single clear. */
export function ActiveFilters({ labels }: { labels: Record<string, string> }) {
  const { params, clearAll, setParam } = useFilterState();

  const active: { key: string; value: string }[] = [];
  for (const key of Object.keys(labels)) {
    for (const value of params.getAll(key)) active.push({ key, value });
  }
  const query = params.get("q");

  if (active.length === 0 && !query) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {query ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-muted">
          Search: {query}
          <button
            type="button"
            onClick={() => setParam("q", null)}
            aria-label="Clear search filter"
            className="text-ghost transition-colors hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : null}
      {active.map(({ key, value }) => (
        <span
          key={`${key}-${value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-muted"
        >
          <span className="text-ghost">{labels[key]}:</span>
          {value.replace(/_/g, " ")}
          <button
            type="button"
            onClick={() =>
              setParam(
                key,
                params.getAll(key).filter((v) => v !== value),
              )
            }
            aria-label={`Remove ${labels[key]} filter ${value}`}
            className="text-ghost transition-colors hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="xs" onClick={clearAll}>
        Clear all
      </Button>
    </div>
  );
}

/** Layout wrapper so every list module has the same filter row. */
export function FilterBar({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
