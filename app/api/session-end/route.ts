import { generateObject } from "ai";
import { z } from "zod";
import type { Game, Playthrough, Session } from "@/lib/types";
import { buildSessionEndPrompt } from "@/lib/build-session-end-prompt";
import { DEFAULT_MODEL, isKnownModel } from "@/lib/models";
import { MEMORY_CATEGORIES } from "@/lib/types";
import { resolveModel } from "@/lib/provider";

export const maxDuration = 30;

// Public body — validate loosely (passthrough) and bound nothing exotic; we
// just need a well-formed session/playthrough/game, else 400 not 500.
const bodySchema = z.object({
  session: z.object({ id: z.string() }).passthrough(),
  playthrough: z
    .object({ id: z.string(), modelId: z.string().optional() })
    .passthrough(),
  game: z.object({ id: z.string(), name: z.string() }).passthrough(),
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
  const session = parsed.data.session as unknown as Session;
  const playthrough = parsed.data.playthrough as unknown as Playthrough;
  const game = parsed.data.game as unknown as Game;

  const requested = playthrough.modelId ?? DEFAULT_MODEL;
  const modelId = isKnownModel(requested) ? requested : DEFAULT_MODEL;

  const { object } = await generateObject({
    model: resolveModel(modelId, parsed.data.userKeys ?? {}),
    schema: z.object({
      summary: z.string(),
      proposals: z.array(
        z.object({
          category: z.enum(MEMORY_CATEGORIES as [string, ...string[]]),
          content: z.string(),
        }),
      ),
    }),
    prompt: buildSessionEndPrompt(game, playthrough, session),
  });

  return Response.json(object);
}
