"use client";

import { use } from "react";
import { PlaythroughClient } from "@/components/playthrough/PlaythroughClient";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = use(params);
  return <PlaythroughClient playthroughId={id} sessionId={sessionId} />;
}
