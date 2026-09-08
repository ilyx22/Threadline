import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth/guard";
import { MASTER_TEMPLATE } from "@/lib/templates/master";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { NewClientForm } from "./new-client-form";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireInternal("admin.clients.manage");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/admin/clients" },
          { label: "New client" },
        ]}
      />

      <header className="max-w-2xl">
        <h1 className="text-section">Create a client</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Scaffolds a workspace from the master template. Roughly 80–90% of the system is identical
          between clients — the rest is configuration, and most of that comes from onboarding.
        </p>
      </header>

      <NewClientForm defaultCadence={MASTER_TEMPLATE.cadencePerWeek} />

      <Card>
        <CardHeader
          title="What the master template creates"
          eyebrow="Included"
          description="Change these defaults in src/lib/templates/master.ts to change every future client."
        />
        <CardBody className="pt-0">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-eyebrow mb-2 text-faint">Content pillars</p>
              <ul className="space-y-1">
                {MASTER_TEMPLATE.pillars.map((pillar) => (
                  <li key={pillar} className="text-[12.5px] text-muted">
                    {pillar}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-eyebrow mb-2 text-faint">First tasks</p>
              <ul className="space-y-1">
                {MASTER_TEMPLATE.onboardingTasks.map((task) => (
                  <li key={task.title} className="text-[12.5px] text-muted">
                    {task.title}
                    <span className="ml-1.5 text-[11px] text-ghost">
                      {task.audience === "internal" ? "internal" : "client"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-5 border-t border-line pt-4 text-[12px] leading-relaxed text-ghost">
            Also created: a Brand Brain shell, integration rows for every provider (all honestly
            marked not connected), destination labels for the chosen platforms, and an onboarding
            session ready for the founder to start.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
