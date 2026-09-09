import "@/app/public.css";

/**
 * Sign-in, reset and invitation screens share the public system's paper and
 * type: the first thing a client sees after the public site should look like
 * the same brand. Auth semantics are untouched; this is presentation only.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="tl-public min-h-dvh">{children}</div>;
}
