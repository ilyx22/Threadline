"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ------------------------------- Dropdown ------------------------------- */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

const SURFACE =
  "z-[100] min-w-[10rem] overflow-hidden rounded-lg border border-line-strong bg-elevated p-1 shadow-pop " +
  "data-[state=open]:animate-scale-in";

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(SURFACE, className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

const ITEM =
  "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted outline-none transition-colors " +
  "focus:bg-raised focus:text-ink data-[highlighted]:bg-raised data-[highlighted]:text-ink " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    icon?: React.ElementType;
    destructive?: boolean;
    shortcut?: string;
  }
>(function DropdownMenuItem({ className, icon: Icon, destructive, shortcut, children, ...props }, ref) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(ITEM, destructive && "text-negative focus:text-negative", className)}
      {...props}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
      <span className="flex-1 truncate">{children}</span>
      {shortcut ? <span className="text-[11px] text-ghost">{shortcut}</span> : null}
    </DropdownPrimitive.Item>
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <DropdownPrimitive.CheckboxItem ref={ref} className={cn(ITEM, "pl-8", className)} {...props}>
      <DropdownPrimitive.ItemIndicator className="absolute left-2.5">
        <Check className="size-3.5 text-accent" strokeWidth={3} />
      </DropdownPrimitive.ItemIndicator>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
});

export function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-eyebrow px-2.5 pb-1 pt-2 text-ghost", className)}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-line", className)}
      {...props}
    />
  );
});

/* -------------------------------- Tooltip -------------------------------- */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 300,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  className?: string;
}) {
  if (!content) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={delay}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[110] max-w-xs rounded-md border border-line-strong bg-elevated px-2.5 py-1.5 text-[12px] leading-relaxed text-ink shadow-lg",
            "data-[state=delayed-open]:animate-scale-in",
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-elevated" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* -------------------------------- Popover -------------------------------- */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, sideOffset = 6, align = "end", ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[100] rounded-lg border border-line-strong bg-elevated shadow-pop",
          "data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
