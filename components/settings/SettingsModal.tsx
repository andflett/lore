"use client";

import { useState } from "react";
import { getUserKeys, setUserKeys } from "@/lib/storage";
import { Modal } from "@/components/shared/Modal";
import { Divider } from "@/components/shared/Divider";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { TextField } from "@/components/shared/TextField";
import { Btn } from "@/components/shared/Btn";

interface Props {
  open: boolean;
  onClose: () => void;
}

// App-level settings. Currently just BYOK keys — kept in this browser
// (localStorage), sent per-request to our own API only, never stored
// server-side. With keys set, you run on your own quota and unlock Claude;
// without them, the app uses the free shared demo (Groq + limited search).
export function SettingsModal({ open, onClose }: Props) {
  const [anthropic, setAnthropic] = useState(() => getUserKeys().anthropic ?? "");
  const [tavily, setTavily] = useState(() => getUserKeys().tavily ?? "");

  // Commit on blur (matches the app's inline-save pattern elsewhere).
  const commit = () => setUserKeys({ anthropic, tavily });

  const clear = () => {
    setAnthropic("");
    setTavily("");
    setUserKeys({});
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <SectionLabel>Your API keys · optional</SectionLabel>
      <p className="mb-3 text-[13px] leading-relaxed text-text-t2">
        Bring your own keys to run on your own quota and unlock Claude. They live
        only in this browser and are sent to the server solely to make your
        requests — never saved server-side. Without keys, the app uses the free
        shared demo.
      </p>

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
      </div>

      <Divider />

      <div className="flex justify-end">
        <Btn variant="dim" size="sm" onClick={clear}>
          Clear keys
        </Btn>
      </div>
    </Modal>
  );
}
