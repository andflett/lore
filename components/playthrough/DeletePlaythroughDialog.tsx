"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import type { Playthrough } from "@/lib/types";
import { deletePlaythrough, listSessions } from "@/lib/db";
import { clearLastPlaythrough } from "@/lib/storage";
import { Modal } from "@/components/shared/Modal";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  playthrough: Playthrough;
}

// Two-step destructive confirmation: shows what will be deleted (session
// count), then a single "Delete forever" button. After delete: clear the
// last-playthrough hint and navigate to '/' which redirects to the next
// most recent playthrough or '/new'.
export function DeletePlaythroughDialog({ open, onClose, playthrough }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const sessions = useLiveQuery(
    () => listSessions(playthrough.id),
    [playthrough.id],
    [],
  );

  const confirm = async () => {
    setDeleting(true);
    await deletePlaythrough(playthrough.id);
    clearLastPlaythrough(playthrough.id);
    router.replace("/");
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete playthrough">
      <div className="space-y-3">
        <p className="text-[14px] leading-relaxed text-text-t1">
          This will delete{" "}
          <span className="font-semibold text-text-t3">{playthrough.name}</span>{" "}
          and all{" "}
          <span className="font-semibold text-text-t3">
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </span>{" "}
          of chat history. Playthrough memory will be lost. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="dim" size="sm" onClick={onClose} disabled={deleting}>
            Cancel
          </Btn>
          <Btn variant="danger" size="sm" onClick={confirm} disabled={deleting}>
            <GameIcon name="cancel" size={12} /> Delete forever
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
