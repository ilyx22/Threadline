"use client";

import * as React from "react";
import { Check, Package, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/feedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  deleteIcpAction,
  deleteOfferAction,
  deleteProofAction,
  saveIcpAction,
  saveOfferAction,
  saveProofAction,
} from "@/lib/actions/workspace";
import { CLAIM_PERMISSION_META, PROOF_KIND_META, metaOf } from "@/lib/domain/enums";
import { money } from "@/lib/utils/format";
import type { ActionResult } from "@/lib/actions/shared";
import type { BrandBrainData } from "@/lib/data/workspace";

/**
 * Brand Brain editor.
 *
 * Seven sections behind tabs. Long-form list fields are edited as one-per-line
 * textareas rather than repeater widgets — for this kind of content, a founder
 * dumping ten beliefs into a textarea is faster and less irritating than ten
 * "add another" clicks, and the server splits and cleans the lines.
 */

type Actions = {
  saveCompany: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  saveFounder: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  saveVoice: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  saveRules: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
};

export function BrandBrainEditor({
  slug,
  canEdit,
  blocks,
  offers,
  icps,
  proof,
  currency,
  actions,
}: {
  slug: string;
  canEdit: boolean;
  blocks: BrandBrainData["blocks"];
  offers: BrandBrainData["offers"];
  icps: BrandBrainData["icps"];
  proof: BrandBrainData["proof"];
  currency: string;
  actions: Actions;
}) {
  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="offer" count={offers.length}>
          Offer
        </TabsTrigger>
        <TabsTrigger value="customer" count={icps.length}>
          Customer
        </TabsTrigger>
        <TabsTrigger value="founder">Founder</TabsTrigger>
        <TabsTrigger value="voice">Voice</TabsTrigger>
        <TabsTrigger value="proof" count={proof.length}>
          Proof
        </TabsTrigger>
        <TabsTrigger value="rules">Content rules</TabsTrigger>
      </TabsList>

      {/* --------------------------------- Company -------------------------------- */}
      <TabsContent value="company" className="pt-6">
        <Card>
          <CardHeader
            title="Company"
            eyebrow="Section 01"
            description="What the business actually does, in the words you would use with a peer."
          />
          <ActionForm action={actions.saveCompany}>
            {({ fieldErrors, error }) => (
              <>
                <CardBody className="space-y-5 pt-0">
                  <FormError error={error} />
                  <Field
                    label="What the company does"
                    htmlFor="description"
                    hint="Two or three sentences. Avoid the marketing version — describe it the way you would to another founder."
                    error={fieldErrors.description}
                  >
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={blocks.company.description}
                      rows={5}
                      disabled={!canEdit}
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Website" htmlFor="website" error={fieldErrors.website}>
                      <Input
                        id="website"
                        name="website"
                        defaultValue={blocks.company.website}
                        placeholder="https://"
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field label="Category" htmlFor="category">
                      <Input
                        id="category"
                        name="category"
                        defaultValue={blocks.company.category}
                        placeholder="B2B consulting — sales operations"
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field label="Geography" htmlFor="geography">
                      <Input
                        id="geography"
                        name="geography"
                        defaultValue={blocks.company.geography}
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field label="Team size" htmlFor="teamSize" optional>
                      <Input
                        id="teamSize"
                        name="teamSize"
                        defaultValue={blocks.company.teamSize}
                        disabled={!canEdit}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Products and services"
                    htmlFor="products"
                    hint="One per line."
                    optional
                  >
                    <Textarea
                      id="products"
                      name="products"
                      defaultValue={blocks.company.products.join("\n")}
                      rows={4}
                      disabled={!canEdit}
                    />
                  </Field>

                  <Field label="Revenue range" htmlFor="revenueRange" optional>
                    <Input
                      id="revenueRange"
                      name="revenueRange"
                      defaultValue={blocks.company.revenueRange}
                      disabled={!canEdit}
                    />
                  </Field>
                </CardBody>
                {canEdit ? (
                  <CardFooter>
                    <span className="text-[12px] text-faint">
                      Used by every generation the system runs.
                    </span>
                    <SubmitButton variant="primary" icon={Check}>
                      Save company
                    </SubmitButton>
                  </CardFooter>
                ) : null}
              </>
            )}
          </ActionForm>
        </Card>
      </TabsContent>

      {/* ---------------------------------- Offer --------------------------------- */}
      <TabsContent value="offer" className="pt-6">
        <OfferSection slug={slug} offers={offers} currency={currency} canEdit={canEdit} />
      </TabsContent>

      {/* --------------------------------- Customer -------------------------------- */}
      <TabsContent value="customer" className="pt-6">
        <IcpSection slug={slug} icps={icps} canEdit={canEdit} />
      </TabsContent>

      {/* --------------------------------- Founder --------------------------------- */}
      <TabsContent value="founder" className="pt-6">
        <Card>
          <CardHeader
            title="Founder"
            eyebrow="Section 04"
            description="The material only this person can credibly publish."
          />
          <ActionForm action={actions.saveFounder}>
            {({ fieldErrors, error }) => (
              <>
                <CardBody className="space-y-5 pt-0">
                  <FormError error={error} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Name" htmlFor="founderName" error={fieldErrors.name}>
                      <Input
                        id="founderName"
                        name="name"
                        defaultValue={blocks.founder.name}
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field label="Title" htmlFor="founderTitle">
                      <Input
                        id="founderTitle"
                        name="title"
                        defaultValue={blocks.founder.title}
                        disabled={!canEdit}
                      />
                    </Field>
                  </div>

                  <Field label="Background" htmlFor="bio" hint="Who they are and why anyone should listen.">
                    <Textarea id="bio" name="bio" defaultValue={blocks.founder.bio} rows={4} disabled={!canEdit} />
                  </Field>

                  <Field label="Experience" htmlFor="experience" hint="Roles, companies, outcomes.">
                    <Textarea
                      id="experience"
                      name="experience"
                      defaultValue={blocks.founder.experience}
                      rows={4}
                      disabled={!canEdit}
                    />
                  </Field>

                  <LineField
                    label="Beliefs"
                    name="beliefs"
                    hint="Things they hold to be true that the market mostly does not. One per line."
                    value={blocks.founder.beliefs}
                    disabled={!canEdit}
                  />
                  <LineField
                    label="Strong opinions"
                    name="opinions"
                    hint="Positions they are willing to defend publicly."
                    value={blocks.founder.opinions}
                    disabled={!canEdit}
                  />
                  <LineField
                    label="Stories"
                    name="stories"
                    hint="First-person experiences, especially the expensive ones. These consistently outperform."
                    value={blocks.founder.stories}
                    disabled={!canEdit}
                  />
                  <LineField
                    label="Credentials"
                    name="credentials"
                    value={blocks.founder.credentials}
                    disabled={!canEdit}
                    optional
                  />
                  <LineField
                    label="Anecdotes cleared for content"
                    name="approvedAnecdotes"
                    hint="Personal material explicitly approved for public use."
                    value={blocks.founder.approvedAnecdotes}
                    disabled={!canEdit}
                    optional
                  />
                </CardBody>
                {canEdit ? (
                  <CardFooter>
                    <span className="text-[12px] text-faint">
                      Stories and beliefs are the highest-leverage fields here.
                    </span>
                    <SubmitButton variant="primary" icon={Check}>
                      Save founder
                    </SubmitButton>
                  </CardFooter>
                ) : null}
              </>
            )}
          </ActionForm>
        </Card>
      </TabsContent>

      {/* ---------------------------------- Voice ---------------------------------- */}
      <TabsContent value="voice" className="pt-6">
        <Card>
          <CardHeader
            title="Voice"
            eyebrow="Section 05"
            description="The difference between a script that gets recorded and one that gets rewritten. Examples matter far more than adjectives here."
          />
          <ActionForm action={actions.saveVoice}>
            {({ error }) => (
              <>
                <CardBody className="space-y-5 pt-0">
                  <FormError error={error} />
                  <Field label="Tone" htmlFor="tone" hint="How they come across. Be specific.">
                    <Textarea id="tone" name="tone" defaultValue={blocks.voice.tone} rows={3} disabled={!canEdit} />
                  </Field>
                  <Field label="Vocabulary" htmlFor="vocabulary" hint="Words they use, and categories of word they never use.">
                    <Textarea
                      id="vocabulary"
                      name="vocabulary"
                      defaultValue={blocks.voice.vocabulary}
                      rows={3}
                      disabled={!canEdit}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Sentence structure" htmlFor="sentenceStructure">
                      <Textarea
                        id="sentenceStructure"
                        name="sentenceStructure"
                        defaultValue={blocks.voice.sentenceStructure}
                        rows={3}
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field label="Humour" htmlFor="humour" optional>
                      <Textarea
                        id="humour"
                        name="humour"
                        defaultValue={blocks.voice.humour}
                        rows={3}
                        disabled={!canEdit}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <LineField
                      label="Phrases they use"
                      name="phrasesUsed"
                      value={blocks.voice.phrasesUsed}
                      disabled={!canEdit}
                    />
                    <LineField
                      label="Phrases to avoid"
                      name="phrasesAvoided"
                      value={blocks.voice.phrasesAvoided}
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="rounded-lg border border-line bg-surface p-4">
                    <p className="text-[13px] font-medium text-ink">Calibration examples</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Paste real sentences, not descriptions. These do more to shape output than
                      every other field on this page combined.
                    </p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <LineField
                        label="Sounds like me"
                        name="soundsLikeMe"
                        value={blocks.voice.soundsLikeMe}
                        disabled={!canEdit}
                        rows={6}
                      />
                      <LineField
                        label="Does NOT sound like me"
                        name="notMe"
                        value={blocks.voice.notMe}
                        disabled={!canEdit}
                        rows={6}
                      />
                    </div>
                  </div>
                </CardBody>
                {canEdit ? (
                  <CardFooter>
                    <span className="text-[12px] text-faint">
                      Changes apply to the next generation, not to existing drafts.
                    </span>
                    <SubmitButton variant="primary" icon={Check}>
                      Save voice
                    </SubmitButton>
                  </CardFooter>
                ) : null}
              </>
            )}
          </ActionForm>
        </Card>
      </TabsContent>

      {/* ---------------------------------- Proof ---------------------------------- */}
      <TabsContent value="proof" className="pt-6">
        <ProofSection slug={slug} proof={proof} canEdit={canEdit} />
      </TabsContent>

      {/* ------------------------------- Content rules ----------------------------- */}
      <TabsContent value="rules" className="pt-6">
        <Card>
          <CardHeader
            title="Content rules"
            eyebrow="Section 07"
            description="The operating constraints: where content goes, how often, and what is off-limits."
          />
          <ActionForm action={actions.saveRules}>
            {({ error }) => (
              <>
                <CardBody className="space-y-5 pt-0">
                  <FormError error={error} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Platforms"
                      htmlFor="platforms"
                      hint="Comma separated, using platform keys: linkedin, youtube, youtube_shorts, instagram, tiktok, x."
                    >
                      <Input
                        id="platforms"
                        name="platforms"
                        defaultValue={blocks.contentRules.platforms.join(", ")}
                        disabled={!canEdit}
                      />
                    </Field>
                    <Field
                      label="Target cadence"
                      htmlFor="cadencePerWeek"
                      hint="Published pieces per week. The weekly report measures against this."
                    >
                      <Input
                        id="cadencePerWeek"
                        name="cadencePerWeek"
                        type="number"
                        min={0}
                        max={50}
                        defaultValue={blocks.contentRules.cadencePerWeek}
                        disabled={!canEdit}
                      />
                    </Field>
                  </div>

                  <LineField
                    label="Content pillars"
                    name="pillars"
                    hint="The recurring themes. Ideas are assigned to these."
                    value={blocks.contentRules.pillars}
                    disabled={!canEdit}
                  />
                  <LineField
                    label="Preferred CTAs"
                    name="preferredCtas"
                    value={blocks.contentRules.preferredCtas}
                    disabled={!canEdit}
                  />
                  <LineField
                    label="Topics"
                    name="topics"
                    value={blocks.contentRules.topics}
                    disabled={!canEdit}
                    optional
                  />
                  <LineField
                    label="Banned topics"
                    name="bannedTopics"
                    hint="Absolute. The system will not generate against these."
                    value={blocks.contentRules.bannedTopics}
                    disabled={!canEdit}
                  />

                  <Field
                    label="Compliance notes"
                    htmlFor="complianceNotes"
                    hint="Constraints on claims, client references and regulated language."
                    optional
                  >
                    <Textarea
                      id="complianceNotes"
                      name="complianceNotes"
                      defaultValue={blocks.contentRules.complianceNotes}
                      rows={4}
                      disabled={!canEdit}
                    />
                  </Field>
                </CardBody>
                {canEdit ? (
                  <CardFooter>
                    <span className="text-[12px] text-faint">
                      Banned topics and compliance notes are enforced on every generation.
                    </span>
                    <SubmitButton variant="primary" icon={Check}>
                      Save rules
                    </SubmitButton>
                  </CardFooter>
                ) : null}
              </>
            )}
          </ActionForm>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

/* --------------------------------- Helpers --------------------------------- */

function LineField({
  label,
  name,
  hint,
  value,
  disabled,
  optional,
  rows = 4,
}: {
  label: string;
  name: string;
  hint?: string;
  value: string[];
  disabled?: boolean;
  optional?: boolean;
  rows?: number;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} optional={optional}>
      <Textarea
        id={name}
        name={name}
        defaultValue={value.join("\n")}
        rows={rows}
        disabled={disabled}
        placeholder="One per line"
      />
    </Field>
  );
}

/* ---------------------------------- Offers ---------------------------------- */

function OfferSection({
  slug,
  offers,
  currency,
  canEdit,
}: {
  slug: string;
  offers: BrandBrainData["offers"];
  currency: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = React.useState<BrandBrainData["offers"][number] | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted">
          What the business sells. The primary offer is what content points toward.
        </p>
        {canEdit ? (
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)}>
            Add offer
          </Button>
        ) : null}
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No offer recorded"
          description="Without an offer, generated content can teach but cannot point anywhere. This is the highest-value field in the Brand Brain."
          action={canEdit ? <Button icon={Plus} onClick={() => setCreating(true)}>Add the primary offer</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader
                title={offer.name}
                eyebrow={offer.isPrimary ? "Primary offer" : "Offer"}
                action={
                  canEdit ? (
                    <div className="flex gap-1">
                      <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(offer)}>
                        Edit
                      </Button>
                      <ActionButton
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        action={() => deleteOfferAction(slug, offer.id)}
                        confirm={`Delete the offer "${offer.name}"?`}
                      >
                        <span className="sr-only">Delete</span>
                      </ActionButton>
                    </div>
                  ) : null
                }
              />
              <CardBody className="space-y-3 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{money(offer.priceMinor, offer.currency)}</Badge>
                  <Badge tone="outline">{offer.priceModel.replace(/_/g, " ")}</Badge>
                </div>
                {offer.outcome ? (
                  <p className="text-[13px] leading-relaxed text-ink">{offer.outcome}</p>
                ) : null}
                {offer.mechanism ? (
                  <div>
                    <p className="text-eyebrow mb-1 text-faint">Mechanism</p>
                    <p className="text-[12.5px] leading-relaxed text-muted">{offer.mechanism}</p>
                  </div>
                ) : null}
                {offer.differentiators.length > 0 ? (
                  <div>
                    <p className="text-eyebrow mb-1.5 text-faint">Differentiators</p>
                    <ul className="space-y-1">
                      {offer.differentiators.map((d, i) => (
                        <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {offer.guarantees ? (
                  <div>
                    <p className="text-eyebrow mb-1 text-faint">Guarantee</p>
                    <p className="text-[12.5px] leading-relaxed text-muted">{offer.guarantees}</p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && canEdit ? (
        <OfferDialog
          slug={slug}
          offer={editing}
          currency={currency}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function OfferDialog({
  slug,
  offer,
  currency,
  open,
  onOpenChange,
}: {
  slug: string;
  offer: BrandBrainData["offers"][number] | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={offer ? "Edit offer" : "Add offer"}
          description="The mechanism and outcome matter most — they are what content explains without pitching."
        />
        <ActionForm
          action={saveOfferAction.bind(null, slug, offer?.id ?? null)}
          onSuccess={() => onOpenChange(false)}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Offer name" htmlFor="offerName" error={fieldErrors.name}>
                  <Input id="offerName" name="name" defaultValue={offer?.name} required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Price (${currency})`} htmlFor="price">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={offer ? offer.priceMinor / 100 : 0}
                    />
                  </Field>
                  <Field label="Price model" htmlFor="priceModel">
                    <NativeSelect id="priceModel" name="priceModel" defaultValue={offer?.priceModel ?? "one_off"}>
                      <option value="one_off">One-off</option>
                      <option value="retainer">Retainer</option>
                      <option value="subscription">Subscription</option>
                      <option value="hybrid">Hybrid</option>
                    </NativeSelect>
                  </Field>
                </div>
                <Field label="Outcome" htmlFor="outcome" hint="What the client actually gets. Not features.">
                  <Textarea id="outcome" name="outcome" defaultValue={offer?.outcome ?? ""} rows={3} />
                </Field>
                <Field label="Mechanism" htmlFor="mechanism" hint="How it works, step by step.">
                  <Textarea id="mechanism" name="mechanism" defaultValue={offer?.mechanism ?? ""} rows={4} />
                </Field>
                <Field label="Differentiators" htmlFor="differentiators" hint="One per line.">
                  <Textarea
                    id="differentiators"
                    name="differentiators"
                    defaultValue={offer?.differentiators.join("\n") ?? ""}
                    rows={4}
                  />
                </Field>
                <Field label="CTAs" htmlFor="ctas" hint="One per line. Used verbatim in scripts and captions.">
                  <Textarea id="ctas" name="ctas" defaultValue={offer?.ctas.join("\n") ?? ""} rows={3} />
                </Field>
                <Field label="Guarantee" htmlFor="guarantees" optional>
                  <Textarea id="guarantees" name="guarantees" defaultValue={offer?.guarantees ?? ""} rows={2} />
                </Field>
                <Field label="Not included" htmlFor="exclusions" optional>
                  <Textarea id="exclusions" name="exclusions" defaultValue={offer?.exclusions ?? ""} rows={2} />
                </Field>
                <label className="flex items-center gap-2.5">
                  <Checkbox name="isPrimary" defaultChecked={offer?.isPrimary ?? offer === null} value="on" />
                  <span className="text-[13px] text-ink">
                    Primary offer
                    <span className="ml-1.5 text-[12px] text-faint">
                      — used as the default context for generation
                    </span>
                  </span>
                </label>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{offer ? "Save offer" : "Add offer"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------- ICP ------------------------------------ */

function IcpSection({
  slug,
  icps,
  canEdit,
}: {
  slug: string;
  icps: BrandBrainData["icps"];
  canEdit: boolean;
}) {
  const [editing, setEditing] = React.useState<BrandBrainData["icps"][number] | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted">
          Pains, desires and objections are the raw material of hooks. This section does more for
          resonance than any other.
        </p>
        {canEdit ? (
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)}>
            Add audience
          </Button>
        ) : null}
      </div>

      {icps.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No audience defined"
          description="Without pains and objections, generated hooks default to general advice."
          action={canEdit ? <Button icon={Plus} onClick={() => setCreating(true)}>Define the audience</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {icps.map((icp) => (
            <Card key={icp.id}>
              <CardHeader
                title={icp.name}
                eyebrow={icp.isPrimary ? "Primary audience" : "Audience"}
                action={
                  canEdit ? (
                    <div className="flex gap-1">
                      <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(icp)}>
                        Edit
                      </Button>
                      <ActionButton
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        action={() => deleteIcpAction(slug, icp.id)}
                        confirm={`Delete the audience "${icp.name}"?`}
                      >
                        <span className="sr-only">Delete</span>
                      </ActionButton>
                    </div>
                  ) : null
                }
              />
              <CardBody className="pt-0">
                {icp.description ? (
                  <p className="text-[13px] leading-relaxed text-ink">{icp.description}</p>
                ) : null}
                {icp.firmographics ? (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{icp.firmographics}</p>
                ) : null}
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <ListBlock title="Pains" items={icp.pains} tone="negative" />
                  <ListBlock title="Desired outcomes" items={icp.desires} tone="positive" />
                  <ListBlock title="Objections" items={icp.objections} tone="warning" />
                  <ListBlock title="Buying triggers" items={icp.triggers} tone="accent" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && canEdit ? (
        <IcpDialog
          slug={slug}
          icp={editing}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "negative" | "positive" | "warning" | "accent";
}) {
  const dot = {
    negative: "bg-negative",
    positive: "bg-positive",
    warning: "bg-warning",
    accent: "bg-accent",
  }[tone];

  return (
    <div className="min-w-0">
      <p className="text-eyebrow mb-2 text-faint">{title}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-ghost">Not recorded</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
              <span className={`mt-1.5 size-1 shrink-0 rounded-full ${dot}`} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IcpDialog({
  slug,
  icp,
  open,
  onOpenChange,
}: {
  slug: string;
  icp: BrandBrainData["icps"][number] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={icp ? "Edit audience" : "Add audience"}
          description="Use the customer's own words wherever you have them."
        />
        <ActionForm
          action={saveIcpAction.bind(null, slug, icp?.id ?? null)}
          onSuccess={() => onOpenChange(false)}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Audience name" htmlFor="icpName" error={fieldErrors.name}>
                  <Input
                    id="icpName"
                    name="name"
                    defaultValue={icp?.name}
                    placeholder="B2B SaaS founders, £500k–£5m ARR"
                    required
                  />
                </Field>
                <Field label="Description" htmlFor="icpDescription">
                  <Textarea id="icpDescription" name="description" defaultValue={icp?.description ?? ""} rows={3} />
                </Field>
                <Field label="Firmographics" htmlFor="firmographics" optional>
                  <Textarea id="firmographics" name="firmographics" defaultValue={icp?.firmographics ?? ""} rows={3} />
                </Field>
                <Field label="Pains" htmlFor="pains" hint="One per line. Their words, not yours.">
                  <Textarea id="pains" name="pains" defaultValue={icp?.pains.join("\n") ?? ""} rows={5} />
                </Field>
                <Field label="Desired outcomes" htmlFor="desires" hint="One per line.">
                  <Textarea id="desires" name="desires" defaultValue={icp?.desires.join("\n") ?? ""} rows={4} />
                </Field>
                <Field label="Objections" htmlFor="objections" hint="One per line.">
                  <Textarea id="objections" name="objections" defaultValue={icp?.objections.join("\n") ?? ""} rows={4} />
                </Field>
                <Field label="Buying triggers" htmlFor="triggers" hint="One per line.">
                  <Textarea id="triggers" name="triggers" defaultValue={icp?.triggers.join("\n") ?? ""} rows={4} />
                </Field>
                <Field label="Sophistication" htmlFor="sophistication">
                  <NativeSelect
                    id="sophistication"
                    name="sophistication"
                    defaultValue={icp?.sophistication ?? "moderate"}
                  >
                    <option value="low">Low — new to the category</option>
                    <option value="moderate">Moderate — has tried solutions</option>
                    <option value="high">High — has evaluated competitors</option>
                  </NativeSelect>
                </Field>
                <label className="flex items-center gap-2.5">
                  <Checkbox name="isPrimary" defaultChecked={icp?.isPrimary ?? icp === null} value="on" />
                  <span className="text-[13px] text-ink">Primary audience</span>
                </label>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{icp ? "Save audience" : "Add audience"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------- Proof ---------------------------------- */

function ProofSection({
  slug,
  proof,
  canEdit,
}: {
  slug: string;
  proof: BrandBrainData["proof"];
  canEdit: boolean;
}) {
  const [editing, setEditing] = React.useState<BrandBrainData["proof"][number] | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-[13px] text-muted">
          Real evidence, and what may be said about it. Proof marked{" "}
          <span className="text-negative">Do not use</span> is excluded from AI context entirely —
          it will never reach a script.
        </p>
        {canEdit ? (
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)}>
            Add proof
          </Button>
        ) : null}
      </div>

      {proof.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No proof recorded"
          description="Content without proof teaches. Content with proof converts. Testimonials, case studies, and real numbers you are cleared to state."
          action={canEdit ? <Button icon={Plus} onClick={() => setCreating(true)}>Add proof</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proof.map((item) => {
            const kind = metaOf(PROOF_KIND_META, item.kind);
            const permission = metaOf(CLAIM_PERMISSION_META, item.claimStatus);
            return (
              <Card key={item.id} className="flex flex-col">
                <CardHeader
                  title={item.title}
                  eyebrow={kind.label}
                  action={
                    canEdit ? (
                      <div className="flex gap-0.5">
                        <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(item)}>
                          <span className="sr-only">Edit</span>
                        </Button>
                        <ActionButton
                          size="xs"
                          variant="ghost"
                          icon={Trash2}
                          action={() => deleteProofAction(slug, item.id)}
                          confirm={`Delete "${item.title}"?`}
                        >
                          <span className="sr-only">Delete</span>
                        </ActionButton>
                      </div>
                    ) : null
                  }
                />
                <CardBody className="flex-1 space-y-3 pt-0">
                  {item.metricValue ? (
                    <p className="text-[17px] font-medium tabular text-accent">
                      {item.metricValue}
                      {item.metricLabel ? (
                        <span className="ml-2 text-[12px] font-normal text-faint">
                          {item.metricLabel}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {item.body ? (
                    <p className="text-[12.5px] leading-relaxed text-muted">{item.body}</p>
                  ) : null}
                  {item.source ? <p className="text-[11.5px] text-ghost">{item.source}</p> : null}
                </CardBody>
                <CardFooter>
                  <Badge tone={permission.tone}>{permission.label}</Badge>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && canEdit ? (
        <ProofDialog
          slug={slug}
          proof={editing}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ProofDialog({
  slug,
  proof,
  open,
  onOpenChange,
}: {
  slug: string;
  proof: BrandBrainData["proof"][number] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title={proof ? "Edit proof" : "Add proof"}
          description="Record the source. Anything not cleared for use should be marked accordingly."
        />
        <ActionForm
          action={saveProofAction.bind(null, slug, proof?.id ?? null)}
          onSuccess={() => onOpenChange(false)}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <Field label="Type" htmlFor="proofKind">
                  <NativeSelect id="proofKind" name="kind" defaultValue={proof?.kind ?? "case_study"}>
                    <option value="testimonial">Testimonial</option>
                    <option value="case_study">Case study</option>
                    <option value="metric">Metric</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="credential">Credential</option>
                  </NativeSelect>
                </Field>
                <Field label="Title" htmlFor="proofTitle" error={fieldErrors.title}>
                  <Input id="proofTitle" name="title" defaultValue={proof?.title} required />
                </Field>
                <Field label="Detail" htmlFor="proofBody" optional>
                  <Textarea id="proofBody" name="body" defaultValue={proof?.body ?? ""} rows={4} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Metric label" htmlFor="metricLabel" optional>
                    <Input id="metricLabel" name="metricLabel" defaultValue={proof?.metricLabel ?? ""} />
                  </Field>
                  <Field label="Metric value" htmlFor="metricValue" optional>
                    <Input id="metricValue" name="metricValue" defaultValue={proof?.metricValue ?? ""} />
                  </Field>
                </div>
                <Field label="Source" htmlFor="proofSource" hint="Where this came from, so it can be defended.">
                  <Input id="proofSource" name="source" defaultValue={proof?.source ?? ""} />
                </Field>
                <Field
                  label="Usage permission"
                  htmlFor="claimStatus"
                  hint="Prohibited proof is excluded from AI context entirely."
                >
                  <NativeSelect id="claimStatus" name="claimStatus" defaultValue={proof?.claimStatus ?? "allowed"}>
                    <option value="allowed">Cleared for use</option>
                    <option value="needs_review">Needs review</option>
                    <option value="prohibited">Do not use</option>
                  </NativeSelect>
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{proof ? "Save proof" : "Add proof"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
