import Link from "next/link";
import { LogoLink } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/nav";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/who-its-for", label: "Who it is for" },
  { href: "/calculator", label: "Cost calculator" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 lg:px-8">
          <LogoLink href="/" size="md" />
          <MarketingNav items={NAV} />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-md px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink sm:inline-block"
            >
              Sign in
            </Link>
            <ButtonLink href="/apply" variant="accent" size="sm">
              Apply
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <LogoLink href="/" size="sm" />
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                A managed content growth service for expert-led B2B businesses. Installed and run
                with you, not sold self-serve.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <p className="text-eyebrow mb-3 text-faint">Product</p>
                <ul className="space-y-2">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[13px] text-muted transition-colors hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-eyebrow mb-3 text-faint">Company</p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/apply"
                      className="text-[13px] text-muted transition-colors hover:text-ink"
                    >
                      Apply
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="text-[13px] text-muted transition-colors hover:text-ink"
                    >
                      Client sign in
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-ghost">
              © {new Date().getFullYear()} Threadline. Founding client programme.
            </p>
            <p className="text-[12px] text-ghost">
              A productised systems company, not an agency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
