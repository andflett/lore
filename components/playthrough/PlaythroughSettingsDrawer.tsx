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
import { PlaythroughNameField } from "./fields/PlaythroughNameField";
import { CharacterFields } from "./fields/CharacterFields";
import { DifficultyField } from "./fields/DifficultyField";
import { PlaystyleField } from "./fields/PlaystyleField";
import { LocationField } from "./fields/LocationField";
import { SourcesSection } from "./SourcesSection";
import { DeletePlaythroughDialog } from "./DeletePlaythroughDialog";

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
  const [name, setName] = useState(playthrough.name);
  const [characterName, setCharacterName] = useState(playthrough.characterName ?? "");
  const [characterClass, setCharacterClass] = useState(playthrough.characterClass ?? "");
  const [difficulty, setDifficulty] = useState(playthrough.difficulty ?? "");
  const [playstyleNotes, setPlaystyleNotes] = useState(playthrough.playstyleNotes ?? "");
  const [currentLocation, setCurrentLocation] = useState(playthrough.currentLocation ?? "");

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
              Playthrough
            </SectionLabel>
            <PlaythroughNameField
              value={name}
              onChange={setName}
              onBlur={() => save({ name: name.trim() || "Run 1" })}
            />
          </section>

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
                })
              }
            />
          </section>

          <section>
            <SectionLabel>
              Difficulty
            </SectionLabel>
            <DifficultyField
              value={difficulty}
              onChange={setDifficulty}
              onBlur={() => save({ difficulty: difficulty.trim() || undefined })}
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

          <section>
            <SectionLabel>
              Current location
            </SectionLabel>
            <LocationField
              value={currentLocation}
              onChange={setCurrentLocation}
              onBlur={() => save({ currentLocation: currentLocation.trim() || undefined })}
            />
          </section>

          <Divider />

          <section>
            <SectionLabel>
              Sources
            </SectionLabel>
            <SourcesSection game={game} />
          </section>

          <Divider color="var(--color-blood-1)" />

          <section>
            <SectionLabel tone="blood">Danger zone</SectionLabel>
            <p className="mb-2 text-[13px] text-text-t0">
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
