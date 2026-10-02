import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeStats } from "./fake-stats.ts";
import { getHealth } from "./get-health.ts";

test("getHealth passes the link count through", () => {
  assert.deepEqual(getHealth(fakeStats({ links: 7, clicks: 28 }, [])), { status: "ok", links: 7 });
});

test("getHealth reports zero links as 0", () => {
  assert.deepEqual(getHealth(fakeStats({ links: 0, clicks: 0 }, [])), { status: "ok", links: 0 });
});
