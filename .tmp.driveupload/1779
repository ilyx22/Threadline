"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ---------------------------------- Tabs ---------------------------------- */

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-line scrollbar-none",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { count?: number }
>(function TabsTrigger({ className, children, count, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-[13px] font-medium text-faint transition-colors",
        "hover:text-muted",
        "data-[state=active]:border-accent data-[state=active]:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
        className,
      )}
      {...props}
    >
      {children}
      {count != null ? (
        <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10px] tabular text-faint">
          {count}
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
});

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("animate-fade focus-visible:outline-none", className)}
      {...props}
    />
  );
});

/**
 * Link-based tab bar for route-driven sub-navigation (module sections).
 * Kept separate from Radix Tabs because these are real navigations, not
 * client-side panels — the URL must be shareable.
 */
export function LinkTabs({
  items,
  activeHref,
  className,
}: {
  items: { href: string; label: string; count?: number }[];
  activeHref: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-line scrollbar-none",
        className,
      )}
    >
      {items.map((item) => {
        const active = activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-accent text-ink"
                : "border-transparent text-faint hover:text-muted",
            )}
          >
            {item.label}
            {item.count != null ? (
              <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10px] tabular text-faint">
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/* -------------------------------- Accordion ------------------------------- */

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn("border-b border-line last:border-0", className)}
      {...props}
    />
  );
});

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-ink transition-colors hover:text-accent",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className="size-4 shrink-0 text-faint transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden data-[state=closed]:animate-fade data-[state=open]:animate-fade"
      {...props}
    >
      <div className={cn("pb-5 pr-8 text-[14px] leading-relaxed text-muted", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});

/* ------------------------------- ScrollArea ------------------------------- */

export function ScrollArea({
  className,
  viewportClassName,
  children,
}: {
  className?: string;
  viewportClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)}>
      <ScrollAreaPrimitive.Viewport className={cn("size-full", viewportClassName)}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none p-0.5"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-line-strong" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

/* ------------------------------- Breadcrumbs ------------------------------ */

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-[12px]", className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-faint transition-colors hover:text-muted"
              >
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-muted" : "text-faint"} aria-current={last ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!last ? <ChevronRight className="size-3 text-ghost" aria-hidden /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
