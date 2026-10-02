// Every action returns one of these so routes can map outcomes to status codes
// without knowing the rules behind them.
export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "invalid" | "not-found" | "conflict" | "expired"; error: string };
