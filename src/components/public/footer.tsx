import Link from "next/link";
import { FOOTER, SITE } from "@/content/public-site";

export function PublicFooter() {
  return (
    <footer className="tl-band relative overflow-hidden">
      <div className="tl-container py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <p className="tl-label text-[color:var(--ink)]">{SITE.name}</p>
            <p className="tl-body mt-4 max-w-sm text-[15px]">{FOOTER.line}</p>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[color:var(--ink-faint)]">{FOOTER.small}</p>
          </div>
          {FOOTER.columns.map((col) => (
            <div key={col.title}>
              <p className="tl-label mb-3">{col.title}</p>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-11 min-w-11 items-center text-[15px] text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-[color:var(--line)]">
        <p aria-hidden className="tl-display select-none px-5 pb-4 pt-6 text-center text-[clamp(3.5rem,14vw,11rem)] leading-none tracking-[-0.03em] text-[color:var(--ink)] opacity-90">
          THREADLINE
        </p>
      </div>

      <div className="tl-container flex flex-col gap-2 border-t border-[color:var(--line)] py-5 text-[12.5px] text-[color:var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Threadline. Founding client programme.</p>
        <p>You talk. You record. You approve. You sell. Threadline handles the machine.</p>
      </div>
    </footer>
  );
}
