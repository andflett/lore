"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { stoneSurface } from "@/lib/surfaces";
import { createPlaythrough, ensureGame, listGames, listPlaythroughs } from "@/lib/db";
import { Panel } from "@/components/shared/Panel";
import { Btn } from "@/components/shared/Btn";
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
  // Returning users hitting /new explicitly want to start a new run — don't
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

  const finish = async () => {
    setCreating(true);
    const game = await ensureGame(gameName.trim());
    // The run name is just a sidebar label, so derive it from the character
    // rather than asking. Renamable later in Settings.
    const derivedName =
      characterName.trim() || characterClass.trim() || "Run 1";
    const pt = await createPlaythrough({
      gameId: game.id,
      name: derivedName,
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
      hint="All optional. Tell me as much or as little as you like, and you can change any of it later."
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
        <Panel style={{ padding: 24 }}>
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
                <Btn variant="dim" size="sm" onClick={back} disabled={step === 0}>
                  Back
                </Btn>
                {isLast ? (
                  <Btn variant="confirm" size="sm" onClick={finish} disabled={creating || !gameName.trim()}>
                    <GameIcon name="check-mark" size={12} /> Begin
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
