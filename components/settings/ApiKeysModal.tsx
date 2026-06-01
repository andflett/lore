"use client";

import { Modal } from "@/components/shared/Modal";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { ApiKeysFields } from "./ApiKeysFields";

interface Props {
  open: boolean;
  onClose: () => void;
}

// BYOK key entry, opened from the model picker. Keys are kept in this browser
// (localStorage), sent per-request to our own API only, never stored
// server-side. With an Anthropic key set you unlock Claude (Haiku/Sonnet) and
// run on your own quota; without it the app uses the free shared demo.
export function ApiKeysModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Your API keys">
      <SectionLabel>Bring your own keys</SectionLabel>
      <p className="mb-3 text-[13px] leading-relaxed text-text-t2">
        Add an Anthropic key to use Claude (Haiku &amp; Sonnet) on your own
        quota — no demo limits. Keys live only in this browser and are sent to
        the server solely to make your requests, never saved server-side.
      </p>
      <ApiKeysFields />
    </Modal>
  );
}
