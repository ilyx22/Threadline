import type { Metadata } from "next";
import { turnaround } from "@/lib/delivery/qa";
import Link from "next/link";
import { requireInternal } from "@/lib/auth/guard";
import { deliveryLoad } from "@/lib/data/delivery-load";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Gauge } from "lucide-react";

export const metadata: Metadata = { title: "Delivery load" };

const hrs = (m: number) => `${(m / 60).toFixed(1)}h`;
const gbp = (minor: number) => `£${(minor / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

export default async function DeliveryLoadPage() {
  await requireInternal("admin.view");
  const [load, turn] = await Promise.all([deliveryLoad(), turnaround(new Date(Date.now() - 56 * 86_400_000))]);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Delivery load</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Is each client getting easier or harder to serve? Active minutes, waiting minutes and cash cost as operators recorded them, by client and service period. Nothing here is an estimate; a period with no recorded load shows nothing.
        </p>
      </header>

      <Card>
        <CardHeader title="Turnaround, last eight weeks" eyebrow={`${turn.pieces} approved`} description="From the recorded history of each approved piece: medians, not targets." />
        <CardBody className="pt-0 text-[12.5px] text-muted">
          {turn.pieces === 0 ? (
            <p>No piece was approved in the window.</p>
          ) : (
            <>
              <p>
                To first review: <span className="tabular text-ink">{turn.toReviewHours ?? "n/a"} h</span> · review to approval: <span className="tabular text-ink">{turn.reviewToApprovalHours ?? "n/a"} h</span> · revision rounds: <span className="tabular text-ink">{turn.revisions ?? "n/a"}</span>
              </p>
              <ul className="mt-2 space-y-0.5">
                {turn.byEditor.map((e) => (
                  <li key={e.editor}>
                    {e.editor}: {e.pieces} pieces · {e.toApprovalHours ?? "n/a"} h to approval · {e.revisions ?? "n/a"} revisions
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardBody>
      </Card>

      {load.recordedTasks === 0 ? (
        <EmptyState icon={Gauge} title="No load recorded yet" description="Log minutes and a work class on tasks as they complete. This view fills in from those records." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {load.clients.map((c) => (
              <Card key={c.orgId}>
                <CardHeader
                  title={c.orgName}
                  eyebrow={`${c.synthetic ? "SYNTHETIC · " : ""}${hrs(c.totals.activeMinutes)} active · ${hrs(c.totals.waitingMinutes)} waiting · ${gbp(c.totals.costMinor)}`}
                  description={c.direction === "unknown" ? "Fewer than two service periods recorded — no direction yet." : c.direction === "easier" ? "Active minutes fell between the first and latest period." : c.direction === "harder" ? "Active minutes rose between the first and latest period." : "Active minutes are roughly flat across periods."}
                />
                <CardBody className="pt-0">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Period</TH>
                        <TH align="right">Active</TH>
                        <TH align="right">Waiting</TH>
                        <TH align="right">Cost</TH>
                        <TH align="right">Owner-only</TH>
                        <TH align="right">Delegatable</TH>
                        <TH align="right">Automatable</TH>
                        <TH align="right">Blockers</TH>
                        <TH align="right">Switches</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {c.periods.map((p) => (
                        <TR key={p.period}>
                          <TD>P{p.period}</TD>
                          <TD align="right">{hrs(p.activeMinutes)}</TD>
                          <TD align="right">{hrs(p.waitingMinutes)}</TD>
                          <TD align="right">{gbp(p.costMinor)}</TD>
                          <TD align="right">{hrs(p.ownerOnlyMinutes)}</TD>
                          <TD align="right">{hrs(p.delegatableMinutes)}</TD>
                          <TD align="right">{hrs(p.automatableMinutes)}</TD>
                          <TD align="right">{p.blockers + p.dependencies}</TD>
                          <TD align="right">{p.contextSwitches}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                  <p className="mt-2 text-[12px] text-faint">
                    <Link href={`/admin/clients/${c.orgId}`} className="hover:text-muted">Open client</Link>
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="By work class" eyebrow="What could leave the founder's desk" />
              <CardBody className="pt-0">
                <Table>
                  <THead><TR><TH>Class</TH><TH align="right">Active</TH><TH align="right">Tasks</TH><TH align="right">Cost</TH></TR></THead>
                  <TBody>
                    {load.byClass.map((k) => (
                      <TR key={k.workClass}><TD>{k.workClass.replace(/_/g, " ")}</TD><TD align="right">{hrs(k.activeMinutes)}</TD><TD align="right">{k.tasks}</TD><TD align="right">{gbp(k.costMinor)}</TD></TR>
                    ))}
                  </TBody>
                </Table>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="By owner" eyebrow="Who carries the load" />
              <CardBody className="pt-0">
                <Table>
                  <THead><TR><TH>Owner</TH><TH align="right">Active</TH><TH align="right">Waiting</TH><TH align="right">Tasks</TH><TH align="right">Switches</TH></TR></THead>
                  <TBody>
                    {load.byOwner.map((o) => (
                      <TR key={o.ownerName}><TD>{o.ownerName}</TD><TD align="right">{hrs(o.activeMinutes)}</TD><TD align="right">{hrs(o.waitingMinutes)}</TD><TD align="right">{o.tasks}</TD><TD align="right">{o.contextSwitches}</TD></TR>
                    ))}
                  </TBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
