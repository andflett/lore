"use client";

import { Modal } from "@/components/shared/Modal";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { ApiKeysFields } from "./ApiKeysFields";

interface Props {
  open: boolean;
  onClose: () => void;
}

// App-level settings. Currently just BYOK keys — kept in this browser
// (localStorage), sent per-request to our own API only, never stored
// server-side. With keys set, you run on your own quota and unlock Claude;
// without them, the app uses the free shared demo (Groq + limited search).
export function SettingsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <SectionLabel>Your API keys · optional</SectionLabel>
      <p className="mb-3 text-[13px] leading-relaxed text-text-t2">
        Bring your own keys to run on your own quota and unlock Claude. They live
        only in this browser and are sent to the server solely to make your
        requests — never saved server-side. Without keys, the app uses the free
        shared demo.
      </p>
      <ApiKeysFields />
    </Modal>
  );
}
