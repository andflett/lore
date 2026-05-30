"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Game, Playthrough } from "@/lib/types";
import { listGames, updatePlaythrough } from "@/lib/db";
import { Drawer } from "@/components/shared/Drawer";
import { Divider } from "@/components/shared/Divider";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { GameNameField } from "./fields/GameNameField";
import { CharacterFields } from "./fields/CharacterFields";
import { PlaystyleField } from "./fields/PlaystyleField";
import { SourcesSection } from "./SourcesSection";
import { DeletePlaythroughDialog } from "./DeletePlaythroughDialog";
import { derivePlaythroughName } from "@/lib/playthrough-name";

interface Props {
  open: boolean;
  onClose: () => void;
  playthrough: Playthrough;
  game: Game;
}

// Edit playthrough details + per-game sources + danger zone. Auto-saves on
// blur via updatePlaythrough — same UX as the Memory panel.
export function PlaythroughSettingsDrawer({
  open,
  onClose,
  playthrough,
  game,
}: Props) {
  const games = useLiveQuery(() => listGames(), [], []);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const save = (changes: Partial<Playthrough>) =>
    updatePlaythrough(playthrough.id, changes);

  // Local draft state per field so typing doesn't write on every keystroke;
  // commits to Dexie on blur.
  const [characterName, setCharacterName] = useState(playthrough.characterName ?? "");
  const [characterClass, setCharacterClass] = useState(playthrough.characterClass ?? "");
  const [playstyleNotes, setPlaystyleNotes] = useState(playthrough.playstyleNotes ?? "");

  const onClosed = () => {
    setDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <Drawer open={open} onClose={onClosed} title="Playthrough Settings">
        <div className="space-y-5">
          <section>
            <SectionLabel>
              Game
            </SectionLabel>
            <GameNameField
              value={game.name}
              games={games}
              hideSuggestions
              readOnly
            />
            <p className="mt-1 text-[12px] text-text-dim">
              Game name can&apos;t be changed once set. Create a new playthrough to switch games.
            </p>
          </section>

          <Divider />

          <section>
            <SectionLabel>
              Character
            </SectionLabel>
            <CharacterFields
              name={characterName}
              className={characterClass}
              onNameChange={setCharacterName}
              onClassChange={setCharacterClass}
              onBlur={() =>
                save({
                  characterName: characterName.trim() || undefined,
                  characterClass: characterClass.trim() || undefined,
                  // The sidebar label is derived from the character, so keep it
                  // in sync rather than exposing a separate name field.
                  name: derivePlaythroughName(characterName, characterClass),
                })
              }
            />
          </section>

          <section>
            <SectionLabel>
              Playstyle & preferences
            </SectionLabel>
            <PlaystyleField
              value={playstyleNotes}
              onChange={setPlaystyleNotes}
              onBlur={() => save({ playstyleNotes: playstyleNotes.trim() || undefined })}
            />
            <p className="mt-1 text-[12px] text-text-dim">
              Include &ldquo;blind&rdquo; or &ldquo;no spoilers&rdquo; to make the agent ask
              before revealing plot content.
            </p>
          </section>

          <Divider />

          <section>
            <SectionLabel>
              Sources
            </SectionLabel>
            <SourcesSection game={game} />
          </section>

          <Divider color="var(--color-blood)" />

          <section>
            <SectionLabel tone="blood">Danger zone</SectionLabel>
            <p className="mb-2 text-[13px] text-text-t2">
              Deleting this playthrough removes all its sessions and chat history. This can&apos;t be undone.
            </p>
            <Btn variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <GameIcon name="cancel" size={12} /> Delete playthrough
            </Btn>
          </section>
        </div>
      </Drawer>

      <DeletePlaythroughDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        playthrough={playthrough}
      />
    </>
  );
}
