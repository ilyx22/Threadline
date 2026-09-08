"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const Overlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function Overlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]",
        "data-[state=open]:animate-fade",
        className,
      )}
      {...props}
    />
  );
});

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
    hideClose?: boolean;
  }
>(function DialogContent({ className, children, size = "md", hideClose, ...props }, ref) {
  const width = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[min(72rem,calc(100vw-3rem))]",
  }[size];

  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-[95] flex max-h-[calc(100dvh-3rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "rounded-xl border border-line-strong bg-elevated shadow-pop",
          "data-[state=open]:animate-scale-in",
          width,
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose ? (
          <DialogPrimitive.Close
            className="absolute right-3.5 top-3.5 rounded-md p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({
  title,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("border-b border-line px-6 py-4 pr-12", className)}>
      <DialogPrimitive.Title className="text-[15px] font-medium leading-tight text-ink">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {description}
        </DialogPrimitive.Description>
      ) : null}
      {children}
    </div>
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-line px-6 py-3.5 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
   Sheet — side panel built on the same primitive
   ------------------------------------------------------------------------- */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "right" | "left";
    width?: string;
  }
>(function SheetContent({ className, children, side = "right", width = "max-w-xl", ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-y-0 z-[95] flex w-full flex-col border-line-strong bg-elevated shadow-pop",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          width,
          "data-[state=open]:animate-fade",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-3.5 top-3.5 rounded-md p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const SheetHeader = DialogHeader;
export const SheetBody = DialogBody;
export const SheetFooter = DialogFooter;

/* -------------------------------------------------------------------------
   ConfirmDialog — used for every destructive or irreversible action
   ------------------------------------------------------------------------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" hideClose>
        <DialogHeader title={title} description={description} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
