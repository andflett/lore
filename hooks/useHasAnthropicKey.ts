"use client";

import { useEffect, useState } from "react";
import { hasAnthropicKey, USER_KEYS_EVENT } from "@/lib/storage";

// Live read of "does the user have an Anthropic BYOK key?". Starts false so SSR
// and the first client render agree (avoids a hydration mismatch), then syncs
// from localStorage and updates whenever keys change — in this tab (custom
// event from setUserKeys) or another (native storage event).
export function useHasAnthropicKey(): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    const read = () => setHas(hasAnthropicKey());
    read();
    window.addEventListener(USER_KEYS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(USER_KEYS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return has;
}
