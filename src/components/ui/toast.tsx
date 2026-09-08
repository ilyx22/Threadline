"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: { label: string; onClick: () => void };
};

type ToastInput = Omit<Partial<Toast>, "id"> & { title: string };

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Toast state lives in a module-level store rather than context alone so that
 * `toast()` can be called from anywhere, including outside the React tree
 * (e.g. an action helper), without prop-drilling a dispatcher.
 */
type Listener = (toasts: Toast[]) => void;

const store = {
  toasts: [] as Toast[],
  listeners: new Set<Listener>(),
  emit() {
    for (const l of this.listeners) l([...this.toasts]);
  },
  add(input: ToastInput) {
    const id = Math.random().toString(36).slice(2, 10);
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "success",
      duration: input.duration ?? (input.variant === "error" ? 7000 : 4500),
      action: input.action,
    };
    this.toasts = [toast, ...this.toasts].slice(0, 4);
    this.emit();
    return id;
  },
  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  },
};

/** Fire a toast from anywhere. */
export function toast(input: ToastInput) {
  return store.add(input);
}

toast.success = (title: string, description?: string) =>
  store.add({ title, description, variant: "success" });
toast.error = (title: string, description?: string) =>
  store.add({ title, description, variant: "error" });
toast.info = (title: string, description?: string) =>
  store.add({ title, description, variant: "info" });
toast.warning = (title: string, description?: string) =>
  store.add({ title, description, variant: "warning" });

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (ctx) return ctx;
  // Usable without a provider — the store is global.
  return { toast: (i) => store.add(i), dismiss: (id) => store.remove(id) };
}

const VARIANT_META: Record<
  ToastVariant,
  { icon: React.ElementType; className: string; iconClass: string }
> = {
  success: { icon: Check, className: "border-positive/35", iconClass: "text-positive bg-positive-soft" },
  error: { icon: XCircle, className: "border-negative/35", iconClass: "text-negative bg-negative-soft" },
  warning: {
    icon: AlertTriangle,
    className: "border-warning/35",
    iconClass: "text-warning bg-warning-soft",
  },
  info: { icon: Info, className: "border-line-strong", iconClass: "text-info bg-info-soft" },
};

function ToastCard({ item, onDismiss }: { item: Toast; onDismiss: () => void }) {
  const meta = VARIANT_META[item.variant];
  const Icon = meta.icon;

  React.useEffect(() => {
    if (item.duration === Infinity) return;
    const t = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(t);
  }, [item.duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-lg border bg-elevated p-3.5 shadow-lg",
        "animate-rise",
        meta.className,
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
          meta.iconClass,
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-ink">{item.title}</p>
        {item.description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.description}</p>
        ) : null}
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-[13px] font-medium text-accent transition-colors hover:text-accent-bright"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-1 rounded p-1 text-faint transition-colors hover:text-ink"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const listener: Listener = (next) => setToasts(next);
    store.listeners.add(listener);
    setToasts([...store.toasts]);
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex flex-col gap-2.5 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => store.remove(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo<ToastContextValue>(
    () => ({ toast: (i) => store.add(i), dismiss: (id) => store.remove(id) }),
    [],
  );
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
