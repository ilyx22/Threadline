import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { stringify, stringifyArray } from "@/lib/db/json";
import { INTEGRATIONS } from "@/lib/integrations/registry";
import { MASTER_TEMPLATE } from "@/lib/templates/master";
import { createInvitation } from "@/lib/team/invitations";
import { domainOf } from "@/lib/crm/attio";
import { kickCrm, queueCrm } from "@/lib/crm/outbox";
import type { Role } from "@/lib/domain/enums";
import { createDraftEngagement } from "./engagements";
import { initialContractValue } from "@/lib/domain/service-period";

/**
 * Provision a client workspace (COM-03, fixing the non-transactional
 * createClientAction): the workspace, its Brand Brain shell, the master
 * template, the onboarding session, a draft engagement carrying the offer's
 * terms, the link back to the application or prospect, and the CRM outbox
 * rows, all in ONE transaction. The founder is then invited (they choose
 * their own password); nobody else ever types it.
 *
 * Idempotent for conversions: converting an application twice returns the
 * workspace the first conversion made; a returning client (an application
 * whose email already belongs to a client admin elsewhere) still gets a new,
 * separate workspace and an invitation their existing account can accept.
 */
export class ProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvisionError";
  }
}

export type ProvisionInput = {
  name: string;
  slug: string;
  website?: string | null;
  industry?: string | null;
  geography?: string | null;
  currency?: string;
  timezone?: string;
  packageTier?: string;
  cadencePerWeek?: number;
  platforms?: string[];
  seedTemplate?: boolean;
  founder: { name: string; email: string };
  offerKey?: string;
  feeOverrides?: { setupFeeMinor?: number; periodFeeMinor?: number };
  sourceApplicationId?: string | null;
  sourceProspectId?: string | null;
};

type Actor = { userId: string; name: string; role: Role };

export async function provisionClientWorkspace(actor: Actor, input: ProvisionInput) {
  if (input.sourceApplicationId) {
    const app = await prisma.application.findUnique({ where: { id: input.sourceApplicationId }, select: { orgId: true, website: true } });
    if (!app) throw new ProvisionError("That application no longer exists.");
    if (app.orgId) {
      const org = await prisma.organization.findUniqueOrThrow({ where: { id: app.orgId } });
      return { org, inviteLink: null, alreadyConverted: true };
    }
    input = { ...input, website: input.website ?? app.website };
  }
  const platforms = input.platforms?.length ? input.platforms : MASTER_TEMPLATE.platforms;

  let created: { org: { id: string; slug: string; name: string; kind: string; currency: string }; outbox: string[] };
  try {
    created = await prisma.$transaction(
      async (tx) => {
        const org = await tx.organization.create({
          data: {
            slug: input.slug,
            name: input.name.slice(0, 200),
            kind: "client",
            status: "onboarding",
            packageTier: input.packageTier ?? "install",
            onboardingStage: "not_started",
            website: input.website ?? null,
            industry: input.industry ?? null,
            geography: input.geography ?? null,
            currency: input.currency ?? "GBP",
            timezone: input.timezone ?? "Europe/London",
            modulesEnabled: stringifyArray(MASTER_TEMPLATE.modules),
            lastActivityAt: new Date(),
          },
        });
        await tx.brandBrain.create({
          data: {
            orgId: org.id,
            company: stringify({ description: "", website: input.website ?? "", category: input.industry ?? "", geography: input.geography ?? "", products: [], teamSize: "", revenueRange: "" }),
            founder: stringify({ name: input.founder.name, title: "Founder", bio: "", experience: "", beliefs: [], opinions: [], stories: [], credentials: [], approvedAnecdotes: [] }),
            voice: stringify({ tone: "", vocabulary: "", sentenceStructure: "", humour: "", phrasesUsed: [], phrasesAvoided: [], soundsLikeMe: [], notMe: [] }),
            contentRules: stringify({ platforms, formats: MASTER_TEMPLATE.formats, preferredCtas: [], cadencePerWeek: input.cadencePerWeek ?? 3, pillars: MASTER_TEMPLATE.pillars, topics: [], bannedTopics: [], complianceNotes: "" }),
            completeness: 0,
          },
        });
        if (input.seedTemplate !== false) {
          await tx.integration.createMany({ data: INTEGRATIONS.map((i) => ({ orgId: org.id, provider: i.provider, status: "not_configured" })) });
          await tx.socialAccount.createMany({ data: platforms.map((platform) => ({ orgId: org.id, platform, handle: input.slug, isConnected: false })) });
          await tx.task.createMany({
            data: MASTER_TEMPLATE.onboardingTasks.map((t) => ({ orgId: org.id, title: t.title, description: t.description, kind: t.kind, audience: t.audience, priority: t.priority, estimateMin: t.estimateMin })),
          });
        }
        await tx.onboardingSession.create({ data: { orgId: org.id, currentStep: "welcome", status: "in_progress" } });
        const engagement = await createDraftEngagement(tx, {
          orgId: org.id,
          timezone: org.timezone,
          offerKey: input.offerKey,
          overrides: input.feeOverrides,
          createdById: actor.userId,
          sourceApplicationId: input.sourceApplicationId ?? null,
          sourceProspectId: input.sourceProspectId ?? null,
        });
        await tx.organization.update({ where: { id: org.id }, data: { setupFee: engagement.setupFeeMinor, periodFee: engagement.periodFeeMinor } });

        if (input.sourceApplicationId) {
          const linked = await tx.application.updateMany({
            where: { id: input.sourceApplicationId, orgId: null },
            data: { orgId: org.id, convertedAt: new Date(), status: "accepted", outcome: "won" },
          });
          if (linked.count !== 1) throw new ProvisionError("That application was converted by someone else just now.");
        }
        if (input.sourceProspectId) {
          await tx.prospect.updateMany({ where: { id: input.sourceProspectId, orgId: null }, data: { orgId: org.id, convertedAt: new Date(), state: "won" } });
        }

        // CRM mirror (COM-04): company, founder, and the won deal at its initial value.
        const companyEntity = { type: "organization", id: org.id };
        const personEntity = { type: "application", id: input.sourceApplicationId ?? org.id };
        const rows = [
          await queueCrm(tx, { op: "upsert_company", entityType: "organization", entityId: org.id, name: org.name, domain: domainOf(input.website) }, `company:${org.id}`),
          await queueCrm(tx, { op: "upsert_person", entityType: input.sourceApplicationId ? "application" : "membership", entityId: personEntity.id, email: input.founder.email.toLowerCase(), name: input.founder.name, companyEntity }, `person:${personEntity.id}`),
          await queueCrm(
            tx,
            {
              op: "upsert_deal",
              entityType: "engagement",
              entityId: engagement.id,
              name: `${org.name}: Threadline engagement`,
              stage: "won",
              valueMinor: initialContractValue(engagement.setupFeeMinor, engagement.periodFeeMinor),
              currency: engagement.currency,
              companyEntity,
              personEntity: { type: input.sourceApplicationId ? "application" : "membership", id: personEntity.id },
            },
            `deal:${engagement.id}:won`,
          ),
        ];
        return { org, outbox: rows.map((r) => r.id) };
      },
      { timeout: 20_000 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ProvisionError("That workspace slug is already taken.");
    throw e;
  }

  const { link } = await createInvitation(actor, created.org, {
    name: input.founder.name,
    email: input.founder.email,
    title: "Founder",
    role: "client_admin",
    profiles: ["admin", "approver", "commercial"],
    isExpert: true,
  });
  await kickCrm(created.outbox);
  return { org: created.org, inviteLink: link, alreadyConverted: false };
}
