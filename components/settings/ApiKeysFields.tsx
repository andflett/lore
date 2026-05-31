"use client";

import { useState } from "react";
import { getUserKeys, setUserKeys } from "@/lib/storage";
import { TextField } from "@/components/shared/TextField";
import { Btn } from "@/components/shared/Btn";

// The Anthropic + Tavily key inputs, self-contained: reads from localStorage on
// mount, commits on blur. Shared by SettingsModal and UpgradeModal so the BYOK
// entry point is identical everywhere.
export function ApiKeysFields() {
  const [anthropic, setAnthropic] = useState(() => getUserKeys().anthropic ?? "");
  const [tavily, setTavily] = useState(() => getUserKeys().tavily ?? "");

  const commit = () => setUserKeys({ anthropic, tavily });
  const clear = () => {
    setAnthropic("");
    setTavily("");
    setUserKeys({});
  };
  const hasAny = !!(anthropic || tavily);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[12px] text-text-t3">
          Anthropic API key
        </label>
        <TextField
          type="password"
          value={anthropic}
          onChange={setAnthropic}
          onBlur={commit}
          placeholder="sk-ant-…"
          ariaLabel="Anthropic API key"
        />
        <p className="mt-1 text-[11px] text-text-dim">
          Enables Claude (Haiku/Sonnet) + prompt caching ·{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noreferrer"
            className="text-gold-text underline hover:text-gold-bright"
          >
            get a key
          </a>
        </p>
      </div>

      <div>
        <label className="mb-1 block text-[12px] text-text-t3">
          Tavily API key
        </label>
        <TextField
          type="password"
          value={tavily}
          onChange={setTavily}
          onBlur={commit}
          placeholder="tvly-…"
          ariaLabel="Tavily API key"
        />
        <p className="mt-1 text-[11px] text-text-dim">
          Runs wiki search on your own quota ·{" "}
          <a
            href="https://app.tavily.com"
            target="_blank"
            rel="noreferrer"
            className="text-gold-text underline hover:text-gold-bright"
          >
            get a key
          </a>
        </p>
      </div>

      {hasAny && (
        <Btn variant="dim" size="sm" onClick={clear}>
          Clear keys
        </Btn>
      )}
    </div>
  );
}
