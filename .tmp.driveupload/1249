import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES, can, canAssignRole, capabilitiesFor, isInternalRole } from "./roles";
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
