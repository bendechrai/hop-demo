import { test } from "node:test";
import assert from "node:assert/strict";
import { isExpired } from "./is-expired.ts";

const now = new Date("2026-06-01T12:00:00.000Z");

test("isExpired is false for a link with no expiry", () => {
  assert.equal(isExpired({ expiresAt: null }, now), false);
});

test("isExpired is false before the expiry and true from the expiry on", () => {
  assert.equal(isExpired({ expiresAt: "2026-06-01T12:00:00.001Z" }, now), false);
  assert.equal(isExpired({ expiresAt: "2026-06-01T12:00:00.000Z" }, now), true);
  assert.equal(isExpired({ expiresAt: "2026-01-01T00:00:00.000Z" }, now), true);
});
