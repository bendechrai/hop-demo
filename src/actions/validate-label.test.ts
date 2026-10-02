import assert from "node:assert/strict";
import { test } from "node:test";
import { validateLabel } from "./validate-label.ts";

const RULE = "Label must be 1 to 40 characters: letters, digits, spaces and hyphens only.";

test("a valid label is accepted", () => {
  assert.deepEqual(validateLabel("Docs team-2"), { ok: true, value: "Docs team-2" });
});

test("a label is trimmed", () => {
  assert.deepEqual(validateLabel("  docs  "), { ok: true, value: "docs" });
});

test("blank, null and missing mean no label", () => {
  assert.deepEqual(validateLabel("   "), { ok: true, value: null });
  assert.deepEqual(validateLabel(null), { ok: true, value: null });
  assert.deepEqual(validateLabel(undefined), { ok: true, value: null });
});

test("40 characters is the longest allowed", () => {
  assert.deepEqual(validateLabel("a".repeat(40)), { ok: true, value: "a".repeat(40) });
  assert.deepEqual(validateLabel("a".repeat(41)), { ok: false, reason: "invalid", error: RULE });
});

test("a disallowed character is refused with the rule", () => {
  assert.deepEqual(validateLabel("docs!"), { ok: false, reason: "invalid", error: RULE });
});

test("a non-text value is refused", () => {
  assert.deepEqual(validateLabel(5), { ok: false, reason: "invalid", error: RULE });
  assert.deepEqual(validateLabel({}), { ok: false, reason: "invalid", error: RULE });
});
