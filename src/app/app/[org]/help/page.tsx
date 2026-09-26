import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/auth/guard";
import { listRequests } from "@/lib/support/requests";
import { HelpForm } from "./help-client";

export const metadata: Metadata = { title: "Help" };

/** CX-07: ask Threadline for help and see where your requests stand. */
export default async function HelpPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const requests = await listRequests(ctx.org.id);
  const label: Record<string, string> = { open: "Received", investigating: "Being looked at", blocked: "Waiting on something", resolved: "Resolved" };
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-section">Help</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">Something wrong, unclear or stuck? Tell us here. It goes straight to the Threadline team working on your account.</p>
      </header>
      <HelpForm slug={slug} />
      <section aria-labelledby="req-h">
        <h2 id="req-h" className="mb-2 text-[13px] font-medium text-ink">
          Your workspace&apos;s requests
        </h2>
        {requests.length ? (
          <ul className="divide-y divide-line rounded-md border border-line text-[12.5px]">
            {requests.map((r) => (
              <li key={r.id} className="px-3 py-2">
                <p className="text-ink">{r.title}</p>
                <p className="text-muted">
                  {label[r.status] ?? r.status} · {r.createdAt.toLocaleDateString("en-GB")}
                  {r.resolution ? ` · ${r.resolution}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-muted">No requests yet.</p>
        )}
      </section>
    </div>
  );
}
