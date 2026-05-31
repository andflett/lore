"use client";

import type { LimitReason } from "@/hooks/useAgent";
import { Modal } from "@/components/shared/Modal";
import { Divider } from "@/components/shared/Divider";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { Btn } from "@/components/shared/Btn";
import { ApiKeysFields } from "./ApiKeysFields";

interface Props {
  reason: LimitReason | null;
  onClose: () => void;
}

const COPY: Record<LimitReason, string> = {
  user: "You've reached today's free limit on the shared demo.",
  global: "The free demo has hit its daily cap for everyone today.",
};

// Shown when the demo usage limit is hit (HTTP 429). Offers the two ways
// forward: bring your own key (unlimited, runs on your quota) or self-host.
export function UpgradeModal({ reason, onClose }: Props) {
  return (
    <Modal open={reason != null} onClose={onClose} title="Keep going">
      <p className="mb-3 text-[13px] leading-relaxed text-text-t2">
        {reason ? COPY[reason] : ""} Add your own API key to continue with no
        limits (and unlock Claude), or run your own copy.
      </p>

      <SectionLabel>Your API keys</SectionLabel>
      <ApiKeysFields />

      <Divider />

      <div className="flex items-center justify-between">
        <a
          href="https://github.com/andflett/lore#self-hosting"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-gold-text underline hover:text-gold-bright"
        >
          Self-host instead
        </a>
        <Btn variant="confirm" size="sm" onClick={onClose}>
          Done
        </Btn>
      </div>
    </Modal>
  );
}
