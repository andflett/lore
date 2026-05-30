import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { Divider } from "@/components/shared/Divider";

interface Pillar {
  icon: string;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    icon: "open-book",
    title: "A scribe for your playthrough",
    body: "Wyrdscribe keeps a quiet ledger of who you are, where you've been, and what you've chosen — and brings it to every question you ask.",
  },
  {
    icon: "fireplace",
    title: "Yours alone, on this device",
    body: "Your runs never leave this browser. No account, no cloud, no telemetry — your saves are as private as a journal in your own hand.",
  },
  {
    icon: "scroll-unfurled",
    title: "Cited, careful, spoiler-aware",
    body: "Answers come from the wikis you trust, with sources you can verify. Tell it you're playing blind and it'll guard the plot for you.",
  },
];

interface Props {
  onBegin: () => void;
}

// First-run intro screen. Sells the product before asking for inputs.
// Composed of the same primitives used elsewhere — Panel chrome is owned by
// the parent flow, this is just the contents.
export function IntroStep({ onBegin }: Props) {
  return (
    <div>
      <header className="mb-5 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-gold-text">
          <GameIcon name="quill-ink" size={20} />
          <span
            className="font-ui text-[11px] uppercase"
            style={{ letterSpacing: "0.22em" }}
          >
            Wyrdscribe
          </span>
        </div>
        <h1
          className="font-ui text-[18px] uppercase text-text-t3"
          style={{ letterSpacing: "0.18em" }}
        >
          A companion for your runs
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text-t1">
          Ask questions about the game you're playing. Wyrdscribe remembers
          your run, searches the wikis, and answers in your context — without
          ever sending your saves anywhere.
        </p>
      </header>

      <Divider />

      <ul className="mt-5 space-y-4">
        {PILLARS.map((p) => (
          <li key={p.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-gold-b2 bg-stone-s1 text-gold-text">
              <GameIcon name={p.icon} size={14} />
            </span>
            <div className="min-w-0">
              <h3
                className="font-ui text-[10px] uppercase text-gold-text"
                style={{ letterSpacing: "0.16em" }}
              >
                {p.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-t1">
                {p.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <Divider />
      </div>

      <p className="mt-4 text-center text-[12px] italic leading-relaxed text-text-dim">
        Set up a playthrough in under a minute. Edit anything later — none of
        these answers are locked in.
      </p>

      <div className="mt-5 flex justify-center">
        <Btn variant="confirm" size="lg" onClick={onBegin}>
          <GameIcon name="quill-ink" size={14} />
          Get started
        </Btn>
      </div>
    </div>
  );
}
