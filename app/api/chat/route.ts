import { z } from "zod";
import type { Game, Playthrough } from "@/lib/types";
import { DEFAULT_MODEL, isKnownModel } from "@/lib/models";
import { createAgentStream } from "@/lib/agent/stream-bridge";

export const maxDuration = 60;

// The body is public (no auth), so validate shape and bound sizes to limit
// token-cost abuse. game/playthrough are checked loosely with passthrough() —
// we only need the fields the agent reads; extra fields are preserved.
const bodySchema = z.object({
  query: z.string().min(1).max(4000),
  priorMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(50)
    .default([]),
  game: z.object({ id: z.string(), name: z.string() }).passthrough(),
  playthrough: z
    .object({ id: z.string(), gameId: z.string(), modelId: z.string().optional() })
    .passthrough(),
  modelId: z.string().optional(),
  // BYOK keys (optional). Bounded so the public body can't carry junk.
  userKeys: z
    .object({
      anthropic: z.string().max(200).optional(),
      tavily: z.string().max(200).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { query, priorMessages, game, playthrough } = parsed.data;

  // Coerce any unknown model id (client-supplied or stale on the playthrough)
  // to the default rather than passing an arbitrary string to a provider.
  const requested = parsed.data.modelId ?? playthrough.modelId ?? DEFAULT_MODEL;
  const modelId = isKnownModel(requested) ? requested : DEFAULT_MODEL;

  const stream = createAgentStream({
    query,
    priorMessages,
    game: game as unknown as Game,
    playthrough: playthrough as unknown as Playthrough,
    modelId,
    keys: parsed.data.userKeys ?? {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
