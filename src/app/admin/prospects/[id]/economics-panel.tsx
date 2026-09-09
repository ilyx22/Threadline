"use client";

import { Save } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { saveProspectEconomicsAction } from "@/lib/actions/economics";

export type EconomicsView = {
  econCurrency: string;
  typicalDealValueMinor: number | null;
  grossProfitMinor: number | null;
  grossMarginPct: number | null;
  ltvMinor: number | null;
  qualifiedOppValueMinor: number | null;
  cycleLengthDays: number | null;
  closeRatePct: number | null;
  capacityNote: string | null;
  acquisitionCostMinor: number | null;
  acquisitionNote: string | null;
  urgency: string | null;
  economicConsequence: string | null;
  economicsUpdatedAt: string | null;
};

const major = (minor: number | null) => (minor === null ? "" : String(minor / 100));

/** What one more good customer is worth, from disclosed figures only. Says "unknown" rather than guessing. */
export function oneMoreCustomerWorth(e: EconomicsView): string {
  const sym = e.econCurrency === "USD" ? "$" : e.econCurrency === "EUR" ? "€" : "£";
  const fmt = (m: number) => `${sym}${(m / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  if (e.ltvMinor) return `${fmt(e.ltvMinor)} lifetime (disclosed LTV)`;
  if (e.grossProfitMinor) return `${fmt(e.grossProfitMinor)} gross profit per deal (disclosed)`;
  if (e.typicalDealValueMinor && e.grossMarginPct) return `≈ ${fmt(Math.round(e.typicalDealValueMinor * (e.grossMarginPct / 100)))} gross profit (deal value × disclosed margin)`;
  if (e.typicalDealValueMinor) return `${fmt(e.typicalDealValueMinor)} revenue per deal (margin unknown)`;
  return "unknown — not disclosed yet";
}

export function EconomicsPanel({ prospectId, economics }: { prospectId: string; economics: EconomicsView }) {
  return (
    <Card>
      <CardHeader
        title="Discovery economics"
        eyebrow={economics.economicsUpdatedAt ? `Updated ${new Date(economics.economicsUpdatedAt).toLocaleDateString("en-GB")}` : "Not yet recorded"}
        description={`One more good customer is worth: ${oneMoreCustomerWorth(economics)}.`}
      />
      <CardBody className="pt-0">
        <ActionForm action={saveProspectEconomicsAction.bind(null, prospectId)} className="space-y-4">
          {({ error }) => (
            <>
              <FormError error={error} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Currency" htmlFor="econCurrency">
                  <NativeSelect id="econCurrency" name="econCurrency" defaultValue={economics.econCurrency}>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </NativeSelect>
                </Field>
                <Field label="Typical deal value" htmlFor="typicalDealValue" optional>
                  <Input id="typicalDealValue" name="typicalDealValue" type="number" min={0} step="1" defaultValue={major(economics.typicalDealValueMinor)} placeholder="unknown" />
                </Field>
                <Field label="Gross profit per deal" htmlFor="grossProfit" optional>
                  <Input id="grossProfit" name="grossProfit" type="number" min={0} step="1" defaultValue={major(economics.grossProfitMinor)} placeholder="unknown" />
                </Field>
                <Field label="Gross margin %" htmlFor="grossMarginPct" optional>
                  <Input id="grossMarginPct" name="grossMarginPct" type="number" min={0} max={100} step="1" defaultValue={economics.grossMarginPct ?? ""} placeholder="unknown" />
                </Field>
                <Field label="Lifetime value" htmlFor="ltv" optional>
                  <Input id="ltv" name="ltv" type="number" min={0} step="1" defaultValue={major(economics.ltvMinor)} placeholder="unknown" />
                </Field>
                <Field label="Qualified opportunity value" htmlFor="qualifiedOppValue" optional>
                  <Input id="qualifiedOppValue" name="qualifiedOppValue" type="number" min={0} step="1" defaultValue={major(economics.qualifiedOppValueMinor)} placeholder="unknown" />
                </Field>
                <Field label="Sales cycle (days)" htmlFor="cycleLengthDays" optional>
                  <Input id="cycleLengthDays" name="cycleLengthDays" type="number" min={0} step="1" defaultValue={economics.cycleLengthDays ?? ""} placeholder="unknown" />
                </Field>
                <Field label="Close rate %" htmlFor="closeRatePct" optional>
                  <Input id="closeRatePct" name="closeRatePct" type="number" min={0} max={100} step="1" defaultValue={economics.closeRatePct ?? ""} placeholder="unknown" />
                </Field>
                <Field label="Current acquisition cost" htmlFor="acquisitionCost" optional hint="per customer, if they know it">
                  <Input id="acquisitionCost" name="acquisitionCost" type="number" min={0} step="1" defaultValue={major(economics.acquisitionCostMinor)} placeholder="unknown" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Capacity for more customers" htmlFor="capacityNote" optional>
                  <Textarea id="capacityNote" name="capacityNote" rows={2} defaultValue={economics.capacityNote ?? ""} />
                </Field>
                <Field label="How they acquire today" htmlFor="acquisitionNote" optional>
                  <Textarea id="acquisitionNote" name="acquisitionNote" rows={2} defaultValue={economics.acquisitionNote ?? ""} />
                </Field>
                <Field label="Urgency" htmlFor="urgency">
                  <NativeSelect id="urgency" name="urgency" defaultValue={economics.urgency ?? ""}>
                    <option value="">Unknown</option>
                    <option value="now">Now</option>
                    <option value="quarter">This quarter</option>
                    <option value="year">This year</option>
                    <option value="none">No urgency stated</option>
                  </NativeSelect>
                </Field>
                <Field label="Economic consequence of leaving it" htmlFor="economicConsequence" optional>
                  <Textarea id="economicConsequence" name="economicConsequence" rows={2} defaultValue={economics.economicConsequence ?? ""} />
                </Field>
              </div>
              <SubmitButton icon={Save} variant="secondary">Save economics</SubmitButton>
            </>
          )}
        </ActionForm>
      </CardBody>
    </Card>
  );
}
