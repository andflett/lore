import { generateObject } from "ai";
import { z } from "zod";
import type { Game, Playthrough, Session } from "@/lib/types";
import { buildSessionEndPrompt } from "@/lib/build-session-end-prompt";
import { DEFAULT_MODEL } from "@/lib/models";
import { MEMORY_CATEGORIES } from "@/lib/types";
import { resolveModel } from "@/lib/provider";

export const maxDuration = 30;

interface SessionEndBody {
  session: Session;
  playthrough: Playthrough;
  game: Game;
}

export async function POST(req: Request) {
  const { session, playthrough, game }: SessionEndBody = await req.json();

  const { object } = await generateObject({
    model: resolveModel(playthrough.modelId ?? DEFAULT_MODEL),
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
