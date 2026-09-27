import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkbox } from "./checkbox-field";

describe("checkbox field", () => {
  it("is checked by 'on', and unchecked when absent", () => {
    assert.equal(checkbox.parse("on"), true);
    assert.equal(checkbox.parse(undefined), false);
    assert.equal(checkbox.parse("false"), false);
  });

  it("accepts the value sent twice (styled checkbox plus a hidden input), which the New client form once refused silently", () => {
    assert.equal(checkbox.parse(["on", "on"]), true);
    assert.equal(checkbox.parse(["false", "on"]), true);
    assert.equal(checkbox.parse(["false", "false"]), false);
  });
});
