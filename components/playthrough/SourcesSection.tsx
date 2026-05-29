"use client";

import { useState } from "react";
import type { Game, GameSources } from "@/lib/types";
import { updateGame } from "@/lib/db";
import { DEFAULT_INCLUDE_DOMAINS } from "@/lib/tavily";
import { suggestedSourcesFor } from "@/lib/game-sources";
import { titleCase } from "@/lib/text";
import { TextField } from "@/components/shared/TextField";
import { CheckField } from "@/components/shared/CheckField";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { Btn } from "@/components/shared/Btn";
import { Pill } from "@/components/shared/Pill";
import { SortableListRow } from "@/components/shared/SortableListRow";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  game: Game;
}

// Per-game source allowlist UI. Drives Tavily's include_domains and the
// post-search priority re-rank. Stored on Game (shared across all
// playthroughs of the same game).
export function SourcesSection({ game }: Props) {
  const sources: GameSources = game.sources ?? {};
  const include = sources.include ?? [];
  const exclude = sources.exclude ?? [];
  const replaceDefaults = sources.replaceDefaults ?? false;

  // Effective ordered list shown in the UI: defaults (if not replacing) +
  // user includes. Locked rows are the defaults when replaceDefaults=false
  // (still reorderable, just not removable).
  const effective = replaceDefaults
    ? include
    : [...DEFAULT_INCLUDE_DOMAINS.filter((d) => !include.includes(d)), ...include];

  const save = (next: GameSources) =>
    updateGame(game.id, { sources: next });

  const setReplaceDefaults = (value: boolean) =>
    save({ ...sources, replaceDefaults: value });

  const moveTo = (from: number, to: number) => {
    const list = replaceDefaults ? include.slice() : effective.slice();
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    save({ ...sources, include: list });
  };

  const [adding, setAdding] = useState("");
  const submitAdd = () => {
    const d = adding.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    if (include.includes(d) || (!replaceDefaults && DEFAULT_INCLUDE_DOMAINS.includes(d))) {
      setAdding("");
      return;
    }
    save({ ...sources, include: [...include, d] });
    setAdding("");
  };

  const [excluding, setExcluding] = useState("");
  const submitExclude = () => {
    const d = excluding.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    if (exclude.includes(d)) {
      setExcluding("");
      return;
    }
    save({ ...sources, exclude: [...exclude, d] });
    setExcluding("");
  };
  const removeExclude = (domain: string) =>
    save({ ...sources, exclude: exclude.filter((d) => d !== domain) });

  const suggestions = suggestedSourcesFor(game.name).filter(
    (d) => !include.includes(d),
  );
  const applySuggestions = () =>
    save({ ...sources, include: [...suggestions, ...include] });

  // Row classification: is this domain originally a default (not added by the user)?
  const isDefault = (domain: string) =>
    DEFAULT_INCLUDE_DOMAINS.includes(domain) && !include.includes(domain);

  // Removing a default row means "I don't want this domain" — push to exclude
  // so it actually disappears (otherwise it'd come right back from
  // DEFAULT_INCLUDE_DOMAINS). For user-added rows, just drop from include.
  const removeRow = (domain: string) => {
    if (isDefault(domain)) {
      save({ ...sources, exclude: [...exclude, domain] });
    } else {
      save({ ...sources, include: include.filter((d) => d !== domain) });
    }
  };

  return (
    <div className="space-y-4">
      <CheckField checked={replaceDefaults} onChange={setReplaceDefaults}>
        Use my sources only (ignore defaults)
      </CheckField>

      {suggestions.length > 0 && (
        <div className="border border-gold-b1 bg-stone-s0 p-2">
          <p className="mb-2 text-[13px] text-text-t0">
            Suggested for{" "}
            <span className="text-text-t2">{titleCase(game.name)}</span>:
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.map((d) => (
              <Pill key={d}>{d}</Pill>
            ))}
          </div>
          <Btn variant="metal" size="sm" onClick={applySuggestions}>
            <GameIcon name="check-mark" size={12} /> Add all
          </Btn>
        </div>
      )}

      <div>
        <SectionLabel>Allowed sources · in priority order</SectionLabel>
        {effective.length === 0 ? (
          <p className="text-[13px] text-text-dim">
            No sources allowed. Add at least one below.
          </p>
        ) : (
          <ul className="space-y-1">
            {effective.map((domain, i) => {
              const isDefaultRow = isDefault(domain);
              const meta = (
                <span className="flex items-center gap-1.5">
                  {isDefaultRow && <Pill muted>default</Pill>}
                  {i === 0 && (
                    <span
                      className="font-ui text-[9px] uppercase text-gold-text"
                      style={{ letterSpacing: "0.12em" }}
                    >
                      Top priority
                    </span>
                  )}
                </span>
              );
              return (
                <SortableListRow
                  key={domain}
                  index={i}
                  total={effective.length}
                  onMove={moveTo}
                  onRemove={() => removeRow(domain)}
                  removeLabel={`Remove ${domain}`}
                  meta={meta}
                >
                  {domain}
                </SortableListRow>
              );
            })}
          </ul>
        )}

        <div className="mt-2 flex gap-2">
          <TextField
            value={adding}
            onChange={setAdding}
            placeholder="Add a domain (e.g. taintedgrail.wiki.gg)"
            ariaLabel="Add a source domain"
          />
          <Btn variant="confirm" size="sm" onClick={submitAdd}>
            Add
          </Btn>
        </div>
      </div>

      <div>
        <SectionLabel>Excluded sources</SectionLabel>
        {exclude.length === 0 ? (
          <p className="text-[13px] text-text-dim">None.</p>
        ) : (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {exclude.map((d) => (
              <Pill key={d} onRemove={() => removeExclude(d)} removeLabel={`Stop excluding ${d}`}>
                {d}
              </Pill>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <TextField
            value={excluding}
            onChange={setExcluding}
            placeholder="Exclude a domain"
            ariaLabel="Exclude a source domain"
          />
          <Btn variant="dim" size="sm" onClick={submitExclude}>
            Exclude
          </Btn>
        </div>
      </div>
    </div>
  );
}
