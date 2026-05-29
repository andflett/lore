"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listPlaythroughs } from "@/lib/db";
import { LAST_PLAYTHROUGH_KEY } from "@/lib/storage";
import { Spinner } from "@/components/shared/Spinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lastId =
        typeof window !== "undefined"
          ? localStorage.getItem(LAST_PLAYTHROUGH_KEY)
          : null;

      const playthroughs = await listPlaythroughs();
      if (cancelled) return;

      const target =
        playthroughs.find((p) => p.id === lastId) ?? playthroughs[0];

      router.replace(target ? `/playthrough/${target.id}` : "/new");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <Spinner label="Loading…" />;
}
