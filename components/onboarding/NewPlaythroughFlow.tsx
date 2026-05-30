"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { stoneSurface } from "@/lib/surfaces";
import { createPlaythrough, ensureGame, listGames, listPlaythroughs } from "@/lib/db";
import { Panel } from "@/components/shared/Panel";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { OnboardingStep } from "./OnboardingStep";
import { IntroStep } from "./IntroStep";
import { GameNameField } from "@/components/playthrough/fields/GameNameField";
import { PlaythroughNameField } from "@/components/playthrough/fields/PlaythroughNameField";
import { CharacterFields } from "@/components/playthrough/fields/CharacterFields";
import { DifficultyField } from "@/components/playthrough/fields/DifficultyField";
import { PlaystyleField } from "@/components/playthrough/fields/PlaystyleField";
import { LocationField } from "@/components/playthrough/fields/LocationField";

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
  const [name, setName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterClass, setCharacterClass] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [playstyleNotes, setPlaystyleNotes] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setCreating(true);
    const game = await ensureGame(gameName.trim());
    const pt = await createPlaythrough({
      gameId: game.id,
      name: name.trim() || "Run 1",
      characterName: characterName.trim() || undefined,
      characterClass: characterClass.trim() || undefined,
      difficulty: difficulty.trim() || undefined,
      playstyleNotes: playstyleNotes.trim() || undefined,
      currentLocation: currentLocation.trim() || undefined,
    });
    router.replace(`/playthrough/${pt.id}`);
  };

  const steps = [
    <OnboardingStep key="game" title="Which game?" hint="Type to find an existing game, or name a new one.">
      <GameNameField value={gameName} onChange={setGameName} games={games} autoFocus />
    </OnboardingStep>,

    <OnboardingStep key="name" title="Name this playthrough" hint="Optional — handy when you have multiple runs.">
      <PlaythroughNameField value={name} onChange={setName} autoFocus />
    </OnboardingStep>,

    <OnboardingStep key="char" title="Your character" hint="Name and class/build — skip for now if unsure.">
      <CharacterFields
        name={characterName}
        className={characterClass}
        onNameChange={setCharacterName}
        onClassChange={setCharacterClass}
        autoFocus
      />
    </OnboardingStep>,

    <OnboardingStep key="diff" title="Difficulty" hint="Optional.">
      <DifficultyField value={difficulty} onChange={setDifficulty} autoFocus />
    </OnboardingStep>,

    <OnboardingStep key="style" title="Playstyle & preferences" hint="The most useful field — shapes every answer.">
      <PlaystyleField value={playstyleNotes} onChange={setPlaystyleNotes} autoFocus />
    </OnboardingStep>,

    <OnboardingStep key="where" title="Where are you?" hint="Optional — a loose sense of progress.">
      <LocationField value={currentLocation} onChange={setCurrentLocation} autoFocus />
    </OnboardingStep>,
  ];

  const isLast = step === steps.length - 1;
  const canAdvance = step !== 0 || gameName.trim().length > 0;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={stoneSurface("mid")}
    >
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
  );
}
