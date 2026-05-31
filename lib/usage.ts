// Demo usage limiting via Upstash Redis (REST, dependency-free fetch).
//
// Purpose: protect the hosted demo's shared keys (really: Tavily credits +
// Groq rate limits) from abuse. Two gates per UTC day:
//   - per-identity soft cap  (DEMO_DAILY_USER_LIMIT)
//   - global kill-switch     (DEMO_DAILY_GLOBAL_LIMIT) — the hard wallet guard
//
// Disabled entirely when Upstash env vars are absent, so self-hosters and local
// dev are unlimited. BYOK requests skip this (handled in the route) — they run
// on the user's own quota.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// True only when the demo host has configured Upstash. Self-host/dev → false →
// no limiting.
export const limitingEnabled = !!(URL && TOKEN);

const USER_LIMIT = Number(process.env.DEMO_DAILY_USER_LIMIT ?? 15);
const GLOBAL_LIMIT = Number(process.env.DEMO_DAILY_GLOBAL_LIMIT ?? 300);

export interface LimitResult {
  allowed: boolean;
  reason?: "user" | "global";
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
}

// INCR a counter and (re)set its TTL to expire at midnight UTC, in one round
// trip via the Upstash pipeline endpoint. Returns the new count.
async function incrWithTtl(key: string): Promise<number> {
  const res = await fetch(`${URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, secondsUntilMidnightUTC()],
    ]),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const out = (await res.json()) as { result?: number; error?: string }[];
  const first = out[0];
  if (!first || typeof first.result !== "number") {
    throw new Error(`Upstash bad response: ${JSON.stringify(out)}`);
  }
  return first.result;
}

// Check (and consume) one unit of demo budget for `identity`. The per-user cap
// is checked first so a rejected user-capped request doesn't also burn global
// budget. Throws if Upstash is unreachable — the caller decides fail-open vs
// fail-closed.
export async function checkDemoLimit(identity: string): Promise<LimitResult> {
  if (!limitingEnabled) return { allowed: true };
  const day = utcDay();
  const user = await incrWithTtl(`usage:user:${identity}:${day}`);
  if (user > USER_LIMIT) return { allowed: false, reason: "user" };
  const global = await incrWithTtl(`usage:global:${day}`);
  if (global > GLOBAL_LIMIT) return { allowed: false, reason: "global" };
  return { allowed: true };
}
