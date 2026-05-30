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
    icon: "magnifying-glass",
    title: "Searches sources you choose",
    body: "Point it at the wikis you actually trust. Every answer is cited, so you can check its work.",
  },
  {
    icon: "open-book",
    title: "Remembers your run",
    body: "Tell it your character, difficulty, and how you play once. It holds onto that and picks up more as you go, so you're not re-explaining yourself every session.",
  },
  {
    icon: "fireplace",
    title: "Private, no account needed",
    body: "Everything lives in your browser. No sign-in, no cloud, no one reading over your shoulder.",
  },
];

interface Props {
  onBegin: () => void;
}

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
          Your RPG Companion
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text-t2">
          It&apos;s read every wiki so you don&apos;t have to, and it knows
          better than to spoil what&apos;s coming.
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
              <p className="mt-1 text-[13px] leading-relaxed text-text-t2">
                {p.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-center">
        <Btn variant="confirm" size="lg" onClick={onBegin}>
          <GameIcon name="quill-ink" size={14} />
          Get started
        </Btn>
      </div>
    </div>
  );
}
