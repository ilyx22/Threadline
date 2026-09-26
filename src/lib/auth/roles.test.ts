import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES, can, canAssignRole, canAssignRoleIn, canManageMemberWithRole, capabilitiesFor, isInternalRole } from "./roles";
import { ROLES } from "@/lib/domain/enums";

/**
 * The capability matrix is the single definition behind both the UI and the
 * server guards. A regression here silently widens access, so it is tested
 * directly rather than through a page.
 */

describe("role capability matrix", () => {
  it("gives super_admin every capability", () => {
    for (const capability of CAPABILITIES) {
      assert.equal(can("super_admin", capability), true, `super_admin missing ${capability}`);
    }
  });

  it("never lets a client role reach the admin portal", () => {
    for (const role of ["client_admin", "client_member", "editor"] as const) {
      assert.equal(can(role, "admin.view"), false, `${role} can view admin`);
      assert.equal(can(role, "admin.clients.manage"), false, `${role} can manage clients`);
      assert.equal(can(role, "admin.metrics"), false, `${role} can see internal metrics`);
    }
  });

  it("withholds approval from client_member", () => {
    assert.equal(can("client_member", "production.approve"), false);
    assert.equal(can("client_member", "scripts.approve"), false);
    assert.equal(can("client_member", "ideas.approve"), false);
    assert.equal(can("client_member", "distribution.publish"), false);
  });

  it("lets client_member contribute", () => {
    assert.equal(can("client_member", "ideas.create"), true);
    assert.equal(can("client_member", "scripts.edit"), true);
    assert.equal(can("client_member", "recording.complete"), true);
  });

  it("restricts editor to production surfaces", () => {
    assert.equal(can("editor", "production.edit"), true);
    assert.equal(can("editor", "library.upload"), true);
    // No strategy, settings or commercial surfaces.
    assert.equal(can("editor", "brain.view"), false);
    assert.equal(can("editor", "workspace.settings"), false);
    assert.equal(can("editor", "pipeline.view"), false);
    assert.equal(can("editor", "performance.view"), false);
    assert.equal(can("editor", "ai.generate"), false);
  });

  it("treats only super_admin and internal_operator as internal", () => {
    assert.equal(isInternalRole("super_admin"), true);
    assert.equal(isInternalRole("internal_operator"), true);
    assert.equal(isInternalRole("client_admin"), false);
    assert.equal(isInternalRole("client_member"), false);
    assert.equal(isInternalRole("editor"), false);
  });

  it("stops a client admin from minting internal staff", () => {
    assert.equal(canAssignRole("client_admin", "client_member"), true);
    assert.equal(canAssignRole("client_admin", "editor"), true);
    assert.equal(canAssignRole("client_admin", "internal_operator"), false);
    assert.equal(canAssignRole("client_admin", "super_admin"), false);
  });

  it("stops an operator from creating a super admin", () => {
    assert.equal(canAssignRole("internal_operator", "client_admin"), true);
    assert.equal(canAssignRole("internal_operator", "super_admin"), false);
  });

  it("gives every declared role a non-empty capability set", () => {
    for (const role of ROLES) {
      assert.ok(capabilitiesFor(role).length > 0, `${role} has no capabilities`);
    }
  });

  it("keeps client_admin a strict superset of client_member", () => {
    const member = capabilitiesFor("client_member");
    for (const capability of member) {
      assert.equal(
        can("client_admin", capability),
        true,
        `client_admin is missing ${capability} which client_member has`,
      );
    }
  });
});

describe("Threadline's own commercial operations", () => {
  it("is denied to every client role", () => {
    // Prospects, sales calls, the acquisition target and the wedge hypothesis
    // are Threadline's own business. A client role holding either capability
    // would mean a client could read our pipeline from their own login.
    for (const role of ["client_admin", "client_member", "editor"] as const) {
      assert.equal(can(role, "acquisition.view"), false, `${role} can see acquisition`);
      assert.equal(can(role, "acquisition.manage"), false, `${role} can manage acquisition`);
    }
  });

  it("is held by internal staff", () => {
    for (const role of ["internal_operator", "super_admin"] as const) {
      assert.equal(can(role, "acquisition.view"), true);
      assert.equal(can(role, "acquisition.manage"), true);
    }
  });

  it("keeps no client role anywhere near an internal capability", () => {
    const internalOnly = CAPABILITIES.filter((c) => !can("client_admin", c));
    for (const capability of ["acquisition.view", "acquisition.manage"] as const) {
      assert.ok(
        internalOnly.includes(capability),
        `${capability} must stay outside the client matrix`,
      );
    }
  });
});

describe("attribution plumbing", () => {
  it("is denied to every client role", () => {
    // Clients see the answers on Results. Tracked links, raw journeys and the
    // evidence classification are Threadline's working state.
    for (const role of ["client_admin", "client_member", "editor"] as const) {
      assert.equal(can(role, "attribution.manage"), false, `${role} can manage attribution`);
    }
  });

  it("is held by internal staff", () => {
    for (const role of ["internal_operator", "super_admin"] as const) {
      assert.equal(can(role, "attribution.manage"), true);
    }
  });

  it("leaves the curated Results view where clients can reach it", () => {
    // The point of the split is that the answers stay available; only the
    // plumbing is withheld.
    assert.equal(can("client_admin", "performance.view"), true);
    assert.equal(can("client_member", "performance.view"), true);
  });
});

describe("the research corpus", () => {
  it("is denied to every client role", () => {
    // Market evidence and an evaluation rubric are Threadline working state.
    // What they produce reaches a client as strategy, not as raw material.
    for (const role of ["client_admin", "client_member", "editor"] as const) {
      assert.equal(can(role, "corpus.manage"), false, `${role} can reach the corpus`);
    }
  });

  it("is held by internal staff", () => {
    for (const role of ["internal_operator", "super_admin"] as const) {
      assert.equal(can(role, "corpus.manage"), true);
    }
  });
});

describe("staff roles are scoped to the internal organisation (SEC-01)", () => {
  it("never grants a staff role inside a client workspace, whoever acts", () => {
    for (const actor of ["super_admin", "internal_operator", "client_admin"] as const) {
      assert.equal(canAssignRoleIn(actor, "internal_operator", "client"), false, `${actor} minted an operator in a client org`);
      assert.equal(canAssignRoleIn(actor, "super_admin", "client"), false);
    }
  });

  it("lets only a super admin grant internal_operator in the internal organisation", () => {
    assert.equal(canAssignRoleIn("super_admin", "internal_operator", "internal"), true);
    assert.equal(canAssignRoleIn("internal_operator", "internal_operator", "internal"), false);
    assert.equal(canAssignRoleIn("super_admin", "client_admin", "internal"), false);
    assert.equal(canAssignRoleIn("super_admin", "super_admin", "internal"), false);
  });

  it("keeps client role assignment as before in client workspaces", () => {
    assert.equal(canAssignRoleIn("client_admin", "client_member", "client"), true);
    assert.equal(canAssignRoleIn("internal_operator", "client_admin", "client"), true);
    assert.equal(canAssignRoleIn("client_member", "client_member", "client"), false);
  });

  it("stops a client admin changing or removing a staff membership", () => {
    assert.equal(canManageMemberWithRole("client_admin", "internal_operator", "client"), false);
    assert.equal(canManageMemberWithRole("client_admin", "super_admin", "client"), false);
    assert.equal(canManageMemberWithRole("internal_operator", "super_admin", "client"), false);
    assert.equal(canManageMemberWithRole("client_admin", "editor", "client"), true);
    assert.equal(canManageMemberWithRole("internal_operator", "internal_operator", "internal"), false);
  });
});

describe("client permission profiles (TEAM-01)", () => {
  it("lets an approver member approve without admin powers", async () => {
    const { effectiveCapabilities } = await import("./roles");
    const caps = effectiveCapabilities("client_member", ["contributor", "approver"]);
    assert.ok(caps.has("scripts.approve"));
    assert.ok(!caps.has("workspace.members"));
    assert.ok(!caps.has("workspace.settings"));
  });
  it("makes a viewer read-only", async () => {
    const { effectiveCapabilities } = await import("./roles");
    const caps = effectiveCapabilities("client_member", ["viewer"]);
    assert.ok(caps.has("ideas.view"));
    for (const c of ["ideas.create", "library.upload", "scripts.edit", "ai.generate", "tasks.complete"] as const) assert.ok(!caps.has(c), c);
  });
  it("never changes staff or client admin capabilities", async () => {
    const { effectiveCapabilities, capabilitiesFor } = await import("./roles");
    assert.equal(effectiveCapabilities("internal_operator", ["viewer"]).size, capabilitiesFor("internal_operator").length);
    assert.equal(effectiveCapabilities("client_admin", ["viewer"]).size, capabilitiesFor("client_admin").length);
  });
  it("ignores unknown profile names", async () => {
    const { parseProfiles } = await import("./roles");
    assert.deepEqual(parseProfiles('["approver","root","viewer"]'), ["approver", "viewer"]);
    assert.deepEqual(parseProfiles("not json"), []);
  });
});
