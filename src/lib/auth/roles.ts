import type { Role } from "@/lib/domain/enums";

/**
 * Capability matrix.
 *
 * One declaration used by BOTH the server guard and the UI, so a control that is
 * hidden is also genuinely denied, and a control that is shown genuinely works.
 * Hiding a button is never treated as security — `requireCapability` is.
 */

export const CAPABILITIES = [
  // Workspace
  "workspace.view",
  "workspace.settings",
  "workspace.members",
  "workspace.delete",
  // Brand Brain
  "brain.view",
  "brain.edit",
  // Research and signals — internal only. Raw research and undecided machine
  // output are Threadline working state, not something a client browses.
  "research.view",
  "research.edit",
  "signals.view",
  "signals.edit",
  // Recording readiness
  "readiness.view",
  "readiness.assess",
  // Long-form pilot
  "longform.manage",
  // Intelligence runs, constraint diagnosis, installation, proof
  "runs.manage",
  "diagnosis.view",
  "diagnosis.edit",
  "install.signoff",
  "proof.view",
  "proof.edit",
  // Ideas and scripts
  "ideas.view",
  "ideas.create",
  "ideas.approve",
  "scripts.view",
  "scripts.edit",
  "scripts.approve",
  // Production
  "production.view",
  "production.edit",
  "production.assign",
  "production.approve",
  "recording.view",
  "recording.complete",
  // Distribution
  "distribution.view",
  "distribution.edit",
  "distribution.publish",
  // Attribution plumbing. Clients see the answers on Results; the tracked
  // links, raw journeys and evidence classification are operator work.
  "attribution.manage",
  // The content learning loop. Clients see what was learned and what changes
  // next; naming a cause and recording a correction is operator judgement.
  "learning.view",
  "learning.manage",
  // Performance and pipeline
  "performance.view",
  "performance.edit",
  "pipeline.view",
  "pipeline.edit",
  // Library, tasks, reports
  "library.view",
  "library.upload",
  "tasks.view",
  "tasks.complete",
  "reports.view",
  "reports.generate",
  // AI
  "ai.generate",
  // Threadline's own commercial operations. The Living SOP Engine, prospects,
  // sales calls, the acquisition target and the wedge hypothesis. None of this
  // is tenant data and no client role may hold either capability.
  "acquisition.view",
  "acquisition.manage",
  // The research corpus and the Judge. Market evidence and an evaluation rubric
  // are Threadline working state, not tenant data.
  "corpus.manage",
  // Internal
  "admin.view",
  "admin.clients.manage",
  "admin.support",
  "admin.sops",
  "admin.applications",
  "admin.metrics",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const CLIENT_MEMBER: Capability[] = [
  "workspace.view",
  "brain.view",
  "diagnosis.view",
  "proof.view",
  "readiness.view",
  "ideas.view",
  "ideas.create",
  "scripts.view",
  "scripts.edit",
  "production.view",
  "recording.view",
  "recording.complete",
  "distribution.view",
  "performance.view",
  "learning.view",
  "pipeline.view",
  "library.view",
  "library.upload",
  "tasks.view",
  "tasks.complete",
  "reports.view",
  "ai.generate",
];

const EDITOR: Capability[] = [
  "workspace.view",
  "production.view",
  "production.edit",
  "library.view",
  "library.upload",
  "tasks.view",
  "tasks.complete",
  "scripts.view",
  "distribution.view",
];

const CLIENT_ADMIN: Capability[] = [
  ...CLIENT_MEMBER,
  "workspace.settings",
  "workspace.members",
  "brain.edit",
  "diagnosis.edit",
  "install.signoff",
  "proof.edit",
  "ideas.approve",
  "scripts.approve",
  "production.edit",
  "production.assign",
  "production.approve",
  "distribution.edit",
  "distribution.publish",
  "performance.edit",
  "pipeline.edit",
  "reports.generate",
];

const INTERNAL_OPERATOR: Capability[] = [
  ...CLIENT_ADMIN,
  // The operator surface: raw research, undecided signals, intelligence cycles,
  // recording assessment and the long-form entitlement.
  "research.view",
  "research.edit",
  "signals.view",
  "signals.edit",
  "runs.manage",
  "readiness.assess",
  "longform.manage",
  "attribution.manage",
  "learning.manage",
  "acquisition.view",
  "acquisition.manage",
  "corpus.manage",
  "admin.view",
  "admin.clients.manage",
  "admin.support",
  "admin.sops",
  "admin.applications",
];

const SUPER_ADMIN: Capability[] = [...CAPABILITIES];

const MATRIX: Record<Role, ReadonlySet<Capability>> = {
  super_admin: new Set(SUPER_ADMIN),
  internal_operator: new Set(INTERNAL_OPERATOR),
  client_admin: new Set(CLIENT_ADMIN),
  client_member: new Set(CLIENT_MEMBER),
  editor: new Set(EDITOR),
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[role]?.has(capability) ?? false;
}

export function canAny(role: Role, capabilities: Capability[]): boolean {
  return capabilities.some((c) => can(role, c));
}

export function capabilitiesFor(role: Role): Capability[] {
  return [...(MATRIX[role] ?? [])];
}

/** Roles that operate across tenants. Used to decide cross-org visibility. */
export function isInternalRole(role: Role): boolean {
  return role === "super_admin" || role === "internal_operator";
}

/** Roles a client admin is allowed to grant. Never lets a client mint internal staff. */
export const ASSIGNABLE_CLIENT_ROLES: Role[] = ["client_admin", "client_member", "editor"];

export function canAssignRole(actorRole: Role, target: Role): boolean {
  if (actorRole === "super_admin") return true;
  if (actorRole === "internal_operator") return target !== "super_admin";
  if (actorRole === "client_admin") return ASSIGNABLE_CLIENT_ROLES.includes(target);
  return false;
}

/**
 * Role assignment scoped to the kind of workspace (SEC-01).
 *
 * Staff roles live ONLY in the internal Threadline organisation. A client
 * workspace can hold client roles and nothing else, whoever is acting, so no
 * one can mint an operator by granting a staff role inside a client workspace.
 * In the internal organisation only a super admin may grant internal_operator,
 * and super_admin itself is a user flag, never a granted membership role.
 */
export function canAssignRoleIn(actorRole: Role, target: Role, orgKind: string): boolean {
  if (target === "super_admin") return false;
  if (orgKind === "internal") return actorRole === "super_admin" && target === "internal_operator";
  if (!ASSIGNABLE_CLIENT_ROLES.includes(target)) return false;
  return canAssignRole(actorRole, target);
}

/**
 * May the actor change or remove a member who currently holds `current`?
 * Only when the actor could have granted that role in this workspace, so a
 * client admin can never touch a staff membership.
 */
export function canManageMemberWithRole(actorRole: Role, current: Role, orgKind: string): boolean {
  if (current === "super_admin") return actorRole === "super_admin";
  if (orgKind === "internal") return actorRole === "super_admin";
  if (isInternalRole(current)) return isInternalRole(actorRole);
  return canAssignRole(actorRole, current);
}

/** Human-readable reason shown when a control is disabled rather than hidden. */
export function denialReason(role: Role, capability: Capability): string {
  const labels: Partial<Record<Capability, string>> = {
    "production.approve": "Only a workspace admin can approve content.",
    "scripts.approve": "Only a workspace admin can approve scripts.",
    "ideas.approve": "Only a workspace admin can approve ideas.",
    "learning.manage":
      "Naming why a piece under-performed and recording a correction is Threadline's judgement, not a client setting.",
    "distribution.publish": "Only a workspace admin can publish.",
    "workspace.settings": "Only a workspace admin can change settings.",
    "workspace.members": "Only a workspace admin can manage members.",
    "brain.edit": "Only a workspace admin can edit the Brand Brain.",
    "runs.manage":
      "Intelligence cycles are run by Threadline. You see the brief when it is published, with the evidence behind every finding.",
    "research.view":
      "Raw research is Threadline working state. What survives review reaches you in the intelligence brief, with its sources attached.",
    "signals.view":
      "Signals become visible once they are part of your approved strategy, rather than while they are still being argued about.",
    "readiness.assess": "Only Threadline can sign off a recording setup.",
    "longform.manage": "Long-form scope is set by Threadline against an agreed pilot.",
    "attribution.manage":
      "Threadline sets up and maintains the measurement. You see what it found on Results, with how strongly each figure is evidenced.",
    "acquisition.view":
      "Threadline's own prospects, sales calls and acquisition targets. Not part of any client workspace.",
    "acquisition.manage":
      "Threadline's own commercial operations are managed by Threadline staff.",
    "corpus.manage":
      "The research corpus is Threadline's own market evidence. What it produces reaches you as strategy, not as raw material.",
    "signals.edit":
      "Signals are reviewed by Threadline before they reach you. Nothing the system proposes changes strategy until a person decides on it, and you approve the 30-day strategy that comes out of it.",
    "diagnosis.edit": "Only a workspace admin can change the constraint diagnosis.",
    "install.signoff": "Only a workspace admin can sign off the strategy.",
    "proof.edit": "Only a workspace admin can record proof figures.",
  };
  return labels[capability] ?? `Your role (${role.replace(/_/g, " ")}) does not include this action.`;
}
