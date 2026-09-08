import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent" | "link";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Primary is warm-white on dark: confident without spending the accent colour.
  primary:
    "bg-ink text-[color:var(--color-base)] hover:bg-white disabled:hover:bg-ink shadow-sm font-medium",
  // Accent is reserved for the single most important action on a screen.
  accent:
    "bg-accent text-[color:var(--color-base)] hover:bg-accent-bright disabled:hover:bg-accent shadow-sm font-medium",
  secondary:
    "bg-raised text-ink border border-line-strong hover:bg-[#242b32] hover:border-[#3c454f]",
  outline: "border border-line-strong text-ink hover:bg-raised hover:border-[#3c454f]",
  ghost: "text-muted hover:text-ink hover:bg-raised",
  danger: "bg-negative/90 text-white hover:bg-negative border border-negative/40",
  link: "text-accent hover:text-accent-bright underline-offset-4 hover:underline p-0 h-auto",
};

const SIZES: Record<Size, string> = {
  xs: "h-7 px-2.5 text-[12px] gap-1.5 rounded-md",
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-9.5 px-4 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-lg",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 " +
  "disabled:pointer-events-none disabled:opacity-45 select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "active:translate-y-px";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  fullWidth?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "secondary",
    size = "md",
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    fullWidth,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const iconSize = size === "xs" || size === "sm" ? "size-3.5" : "size-4";
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        variant !== "link" && SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} aria-hidden />
      ) : Icon ? (
        <Icon className={iconSize} aria-hidden />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className={iconSize} aria-hidden /> : null}
    </button>
  );
});

export type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  fullWidth?: boolean;
};

export function ButtonLink({
  className,
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  const iconSize = size === "xs" || size === "sm" ? "size-3.5" : "size-4";
  return (
    <Link
      className={cn(
        BASE,
        VARIANTS[variant],
        variant !== "link" && SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className={iconSize} aria-hidden /> : null}
      {children}
      {IconRight ? <IconRight className={iconSize} aria-hidden /> : null}
    </Link>
  );
}

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ElementType;
  label: string;
  variant?: Variant;
  size?: "xs" | "sm" | "md";
  loading?: boolean;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon: Icon, label, className, variant = "ghost", size = "sm", loading, ...props },
    ref,
  ) {
    const box = size === "xs" ? "size-7" : size === "sm" ? "size-8" : "size-9.5";
    const glyph = size === "xs" ? "size-3.5" : "size-4";
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(BASE, VARIANTS[variant], "rounded-md p-0", box, className)}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(glyph, "animate-spin")} aria-hidden />
        ) : (
          <Icon className={glyph} aria-hidden />
        )}
      </button>
    );
  },
);
