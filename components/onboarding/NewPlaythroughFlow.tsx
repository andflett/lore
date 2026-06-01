"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { stoneSurface } from "@/lib/surfaces";
import { createPlaythrough, ensureGame, listGames, listPlaythroughs } from "@/lib/db";
import { derivePlaythroughName } from "@/lib/playthrough-name";
import { Panel } from "@/components/shared/Panel";
import { Btn } from "@/components/shared/Btn";
import { CheckIcon } from "@radix-ui/react-icons";
import { GameIcon } from "@/components/shared/GameIcon";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { OnboardingStep } from "./OnboardingStep";
import { IntroStep } from "./IntroStep";
import { GameNameField } from "@/components/playthrough/fields/GameNameField";
import { CharacterFields } from "@/components/playthrough/fields/CharacterFields";
import { PlaystyleField } from "@/components/playthrough/fields/PlaystyleField";

export function NewPlaythroughFlow() {
  const router = useRouter();
  const games = useLiveQuery(() => listGames(), [], []);
  // Show the intro panel only on a truly fresh visit (no existing playthroughs).
  // Returning users hitting /new explicitly want to start a new playthrough — don't
  // make them re-read the pitch.
  const playthroughs = useLiveQuery(() => listPlaythroughs(), [], []);
  const [introDismissed, setIntroDismissed] = useState(false);
  const showIntro = playthroughs.length === 0 && !introDismissed;
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  const [gameName, setGameName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterClass, setCharacterClass] = useState("");
  const [playstyleNotes, setPlaystyleNotes] = useState("");

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  // On step 0 there's nowhere to go "back" to within the flow. If the player
  // got here from the sidebar's New Playthrough button (i.e. they already have
  // playthroughs), give them a way out instead of a dead disabled button.
  const hasExisting = playthroughs.length > 0;
  const cancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const finish = async () => {
    setCreating(true);
    const game = await ensureGame(gameName.trim());
    const pt = await createPlaythrough({
      gameId: game.id,
      name: derivePlaythroughName(characterName, characterClass),
      characterName: characterName.trim() || undefined,
      characterClass: characterClass.trim() || undefined,
      playstyleNotes: playstyleNotes.trim() || undefined,
    });
    router.replace(`/playthrough/${pt.id}`);
  };

  const steps = [
    <OnboardingStep key="game" title="Which game?" hint="Type to find an existing game, or name a new one.">
      <GameNameField value={gameName} onChange={setGameName} games={games} autoFocus />
    </OnboardingStep>,

    <OnboardingStep
      key="run"
      title="Your character"
      hint="All optional. You can change any of it later."
    >
      <div className="space-y-4">
        <div>
          <SectionLabel>Character</SectionLabel>
          <CharacterFields
            name={characterName}
            className={characterClass}
            onNameChange={setCharacterName}
            onClassChange={setCharacterClass}
            autoFocus
          />
        </div>
        <div>
          <SectionLabel>How you play</SectionLabel>
          <PlaystyleField value={playstyleNotes} onChange={setPlaystyleNotes} />
        </div>
      </div>
    </OnboardingStep>,
  ];

  const isLast = step === steps.length - 1;
  const canAdvance = step !== 0 || gameName.trim().length > 0;

  return (
    <div
      className="message-overlay h-[100dvh] overflow-y-auto"
      style={stoneSurface("raised")}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-[min(480px,100%)]">
        <Panel className="p-5 sm:p-6">
          {showIntro ? (
            <IntroStep onBegin={() => setIntroDismissed(true)} />
          ) : (
            <>
              <div className="mb-5 flex items-center gap-2 text-gold-text">
                <GameIcon name="dragon" size={18} />
                <span
                  className="font-ui text-[11px] uppercase"
                  style={{ letterSpacing: "0.18em" }}
                >
                  New Playthrough · {step + 1}/{steps.length}
                </span>
              </div>

              {steps[step]}

              <div className="mt-6 flex items-center justify-between">
                {step === 0 ? (
                  <Btn variant="dim" size="sm" onClick={cancel} disabled={!hasExisting}>
                    Cancel
                  </Btn>
                ) : (
                  <Btn variant="dim" size="sm" onClick={back}>
                    Back
                  </Btn>
                )}
                {isLast ? (
                  <Btn variant="confirm" size="sm" onClick={finish} disabled={creating || !gameName.trim()}>
                    <CheckIcon className="h-3.5 w-3.5" /> Begin
                  </Btn>
                ) : (
                  <Btn variant="confirm" size="sm" onClick={next} disabled={!canAdvance}>
                    Next
                  </Btn>
                )}
              </div>
            </>
          )}
        </Panel>
        </div>
      </div>
    </div>
  );
}
