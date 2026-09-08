import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LONG_FORM_MODULE,
  LONG_FORM_PACKAGING,
  aspectRatioFor,
  assertLongFormAllowed,
  assertPackageApprovable,
  availableFormats,
  isLongForm,
  longFormEnabled,
  longFormScope,
  missingPackagingFields,
  orientationFor,
} from "./longform";
import { WorkflowError } from "./workflow";

/**
 * The rule these tests protect: long-form is a pilot with its own capacity and
 * pricing. It must never become a silent part of every retainer, and it must
 * never ship without the two things that carry a long-form piece.
 */

const enabled = JSON.stringify(["intelligence", LONG_FORM_MODULE]);
const disabled = JSON.stringify(["intelligence", "production"]);

describe("format classification", () => {
  it("recognises the long-form shapes", () => {
    assert.equal(isLongForm("long_form"), true);
    assert.equal(isLongForm("interview"), true);
    assert.equal(isLongForm("documentary"), true);
  });

  it("leaves short-form alone", () => {
    for (const format of ["short_form", "talking_head", "carousel", "text_post"]) {
      assert.equal(isLongForm(format), false, `${format} is not long-form`);
    }
  });

  it("derives orientation rather than storing it", () => {
    assert.equal(orientationFor("long_form"), "horizontal");
    assert.equal(orientationFor("short_form"), "vertical");
    assert.equal(aspectRatioFor("long_form"), "16:9");
    assert.equal(aspectRatioFor("short_form"), "9:16");
  });
});

describe("entitlement", () => {
  it("is off unless the module is explicitly enabled", () => {
    assert.equal(longFormEnabled(disabled), false);
    assert.equal(longFormEnabled(null), false);
    assert.equal(longFormEnabled("[]"), false);
    assert.equal(longFormEnabled("not json at all"), false);
    assert.equal(longFormEnabled(enabled), true);
  });

  it("LABELS LONG-FORM AS A PILOT when it is not in scope", () => {
    const scope = longFormScope(disabled);
    assert.match(scope.label, /pilot/i);
    assert.match(scope.note, /not part of this client's retainer/i);
  });

  it("says so plainly when it is in scope", () => {
    const scope = longFormScope(enabled);
    assert.match(scope.label, /enabled/i);
    assert.match(scope.note, /agreed separately/i);
  });

  it("REFUSES long-form work for a client without the module", () => {
    assert.throws(
      () => assertLongFormAllowed("long_form", disabled, "Northbeam"),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /does not have long-form in scope/i);
        assert.match(error.message, /Northbeam/);
        return true;
      },
    );
  });

  it("allows it once enabled, and never blocks short-form", () => {
    assert.doesNotThrow(() => assertLongFormAllowed("long_form", enabled));
    assert.doesNotThrow(() => assertLongFormAllowed("short_form", disabled));
    assert.doesNotThrow(() => assertLongFormAllowed("carousel", null));
  });

  it("does not offer long-form formats when it is out of scope", () => {
    const offered = availableFormats(disabled);
    assert.equal(offered.some(isLongForm), false);
    assert.ok(offered.includes("short_form"));

    const all = availableFormats(enabled);
    assert.ok(all.some(isLongForm));
  });
});

describe("long-form packaging", () => {
  const complete = {
    workingTitle: "Working",
    title: "The first thirty days",
    thumbnailRef: "https://files.example.com/thumb.jpg",
    description: "What we actually do in month one.",
  };

  it("requires a final title, a thumbnail and a description", () => {
    const required = LONG_FORM_PACKAGING.filter((f) => f.required).map((f) => f.key);
    assert.deepEqual(required.sort(), ["description", "thumbnailRef", "title"]);
  });

  it("treats the working title as optional", () => {
    assert.equal(LONG_FORM_PACKAGING.find((f) => f.key === "workingTitle")?.required, false);
  });

  it("REFUSES to approve long-form packaging without a title or thumbnail", () => {
    assert.throws(
      () => assertPackageApprovable("long_form", { ...complete, title: null }),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /Final title/);
        assert.match(error.message, /somebody improvises at upload time/i);
        return true;
      },
    );
    assert.throws(
      () => assertPackageApprovable("long_form", { ...complete, thumbnailRef: "  " }),
      WorkflowError,
    );
  });

  it("names everything that is missing at once", () => {
    const missing = missingPackagingFields({});
    assert.equal(missing.length, 3);
  });

  it("approves a complete long-form package", () => {
    assert.doesNotThrow(() => assertPackageApprovable("long_form", complete));
  });

  it("does not impose long-form requirements on short-form", () => {
    assert.doesNotThrow(() => assertPackageApprovable("short_form", {}));
    assert.doesNotThrow(() => assertPackageApprovable("carousel", { title: null }));
  });
});
