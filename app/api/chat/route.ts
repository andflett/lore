import { z } from "zod";
import type { Game, Playthrough } from "@/lib/types";
import { DEFAULT_MODEL } from "@/lib/models";
import { createAgentStream } from "@/lib/agent/stream-bridge";

export const maxDuration = 60;

const bodySchema = z.object({
  query: z.string().min(1).max(4000),
  priorMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // playthrough/game are large objects passed straight through (not re-validated).
  const { playthrough, game, modelId } = json as {
    playthrough: Playthrough;
    game: Game;
    modelId?: string;
  };

  const stream = createAgentStream({
    query: parsed.data.query,
    priorMessages: parsed.data.priorMessages,
    game,
    playthrough,
    modelId: modelId ?? playthrough.modelId ?? DEFAULT_MODEL,
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
