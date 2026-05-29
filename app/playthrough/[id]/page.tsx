"use client";

import { use } from "react";
import { PlaythroughClient } from "@/components/playthrough/PlaythroughClient";

export default function PlaythroughPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PlaythroughClient playthroughId={id} />;
}
