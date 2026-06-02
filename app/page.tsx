"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { listPlaythroughs } from "@/lib/db";
import { LAST_PLAYTHROUGH_KEY } from "@/lib/storage";
import { stoneSurface } from "@/lib/surfaces";
import { Btn } from "@/components/shared/Btn";
import { CornerDeco } from "@/components/shared/CornerDeco";
import { COLORS as C } from "@/lib/tokens";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function openLastSession() {
    setLoading(true);
    const lastId =
      typeof window !== "undefined"
        ? localStorage.getItem(LAST_PLAYTHROUGH_KEY)
        : null;
    const playthroughs = await listPlaythroughs();
    const target =
      playthroughs.find((p) => p.id === lastId) ?? playthroughs[0];
    router.push(target ? `/playthrough/${target.id}` : "/new");
  }

  return (
    <div
      className="h-[100dvh] w-full flex items-center justify-center"
      style={stoneSurface("deep")}
    >
      <div
        className="relative flex flex-col items-center gap-8 p-12"
        style={{
          background: `linear-gradient(180deg, ${C.s2} 0%, ${C.s0} 100%)`,
          border: `2px solid ${C.b3}`,
          borderBottom: `3px solid ${C.b2}`,
          boxShadow: `inset 0 1px 0 rgba(240,200,100,0.1), 0 0 0 1px ${C.b1}, 0 8px 32px rgba(0,0,0,0.8)`,
        }}
      >
        <CornerDeco style={{ top: -2, left: -2 }} />
        <CornerDeco style={{ top: -2, right: -2 }} />
        <CornerDeco style={{ bottom: -2, left: -2 }} />
        <CornerDeco style={{ bottom: -2, right: -2 }} />

        <h1
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 28,
            letterSpacing: "0.2em",
            color: C.t3,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Wyrdscribe
        </h1>

        <Btn
          variant="confirm"
          size="lg"
          onClick={openLastSession}
          disabled={loading}
        >
          {loading ? "Loading…" : "Open Last Session"}
        </Btn>
      </div>
    </div>
  );
}
