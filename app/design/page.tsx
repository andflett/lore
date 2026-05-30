import type { Metadata } from "next";
import { stoneSurface } from "@/lib/surfaces";
import { Panel } from "@/components/shared/Panel";
import { PanelTitle } from "@/components/shared/PanelTitle";
import { Divider } from "@/components/shared/Divider";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { DesignFormPreview } from "./DesignFormPreview";

export const metadata: Metadata = {
  title: "Design System",
};

const SWATCHES: { label: string; value: string; varName: string }[] = [
  { label: "void", value: "#080807", varName: "--color-void" },
  { label: "stone s0", value: "#0f0e0c", varName: "--color-stone-s0" },
  { label: "stone s1", value: "#161410", varName: "--color-stone-s1" },
  { label: "stone s2", value: "#1e1c18", varName: "--color-stone-s2" },
  { label: "stone s3", value: "#272420", varName: "--color-stone-s3" },
  { label: "gold b1", value: "#342408", varName: "--color-gold-b1" },
  { label: "gold b2", value: "#5e3c0c", varName: "--color-gold-b2" },
  { label: "gold b3", value: "#8c6010", varName: "--color-gold-b3" },
  { label: "gold", value: "#c8921a", varName: "--color-gold" },
  { label: "gold bright", value: "#dca830", varName: "--color-gold-bright" },
  { label: "gold text", value: "#f0d070", varName: "--color-gold-text" },
  { label: "text t0", value: "#948e84", varName: "--color-text-t0" },
  { label: "text t1", value: "#bab6aa", varName: "--color-text-t1" },
  { label: "text t2", value: "#d8d4c8", varName: "--color-text-t2" },
  { label: "text t3", value: "#eeeae0", varName: "--color-text-t3" },
  { label: "blood 0", value: "#3c0a0a", varName: "--color-blood-0" },
  { label: "blood 1", value: "#7a1c1c", varName: "--color-blood-1" },
  { label: "blood", value: "#b83030", varName: "--color-blood" },
  { label: "blood bright", value: "#e25555", varName: "--color-blood-bright" },
  { label: "blood text", value: "#f5b0b0", varName: "--color-blood-text" },
  { label: "verdant", value: "#2a5020", varName: "--color-verdant" },
];

const ICONS = [
  "open-book",
  "treasure-map",
  "crossroads",
  "cowled",
  "castle",
  "quill-ink",
  "dragon",
  "sunrise",
  "moon-bats",
  "magnifying-glass",
  "scroll-unfurled",
  "check-mark",
  "cancel",
  "crystal-ball",
  "light-bulb",
  "halberd",
  "broadsword",
  "crescent-blade",
  "dragon-head",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="font-ui mb-3 text-[11px] uppercase text-gold-text"
        style={{ letterSpacing: "0.22em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="min-h-screen px-4 py-8" style={stoneSurface("recessed")}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1
            className="font-ui text-[22px] uppercase text-text-t3"
            style={{ letterSpacing: "0.2em" }}
          >
            Wyrdscribe
          </h1>
          <p className="mt-1 text-text-t0">Design system — kitchen sink (dev only)</p>
        </header>

        <Section title="Colour palette">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <div key={s.varName} className="border border-gold-b1">
                <div className="h-12 w-full" style={{ background: s.value }} />
                <div className="px-2 py-1">
                  <div className="text-[12px] text-text-t2">{s.label}</div>
                  <div className="text-[11px] text-text-dim">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography — Crimson Text (body)">
          <div className="space-y-1 text-text-t2">
            <p style={{ fontSize: 16 }}>16px — The Dying Knight waits in the Ossuary.</p>
            <p style={{ fontSize: 14 }}>14px — Answer questions concisely and practically.</p>
            <p style={{ fontSize: 13 }}>13px — Prefer wiki results over generic gaming sites.</p>
            <p className="text-text-t0" style={{ fontSize: 14 }}>
              14px muted — placeholder / caption text.
            </p>
          </div>
        </Section>

        <Section title="Typography — Cinzel (chrome)">
          <div className="space-y-2 text-gold-text">
            <div className="font-ui" style={{ fontSize: 12, letterSpacing: "0.2em" }}>
              12px Panel Title
            </div>
            <div className="font-ui" style={{ fontSize: 10, letterSpacing: "0.15em" }}>
              10px Section Label
            </div>
            <div className="font-ui" style={{ fontSize: 8, letterSpacing: "0.12em" }}>
              8px Button Caption
            </div>
          </div>
        </Section>

        <Section title="Surface elevations">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["raised", "mid", "recessed", "deep"] as const).map((e) => (
              <div
                key={e}
                className="flex h-20 items-end border border-gold-b1 p-2"
                style={stoneSurface(e)}
              >
                <span className="font-ui text-[10px] uppercase text-text-t2">{e}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Panel">
          <Panel className="mb-6">
            <PanelTitle right={<Btn size="sm" variant="dim">Close</Btn>}>
              Playthrough Memory
            </PanelTitle>
            <div className="space-y-3 p-4 text-text-t1">
              <p>
                A panel with the gilded multi-layer border, stone texture, and four corner
                rivets. Nothing rounded; everything hard-edged.
              </p>
              <Divider />
              <p className="text-text-t0">A divider separates regions within a panel.</p>
            </div>
          </Panel>
          <Panel active className="mb-2">
            <div className="p-4 text-text-t2">
              <span className="font-ui text-[10px] uppercase text-gold-bright">Active state</span>
              <p className="mt-1">Brighter gold border + glow when focused.</p>
            </div>
          </Panel>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Btn variant="confirm">
              <GameIcon name="check-mark" size={14} /> Accept
            </Btn>
            <Btn variant="default">Default</Btn>
            <Btn variant="metal">Metal</Btn>
            <Btn variant="dim">Dim</Btn>
            <Btn variant="danger">
              <GameIcon name="cancel" size={14} /> Discard
            </Btn>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Btn size="sm">Small</Btn>
            <Btn size="md">Medium</Btn>
            <Btn size="lg">Large</Btn>
            <Btn icon variant="metal">
              <GameIcon name="open-book" size={16} />
            </Btn>
            <Btn icon variant="metal">
              <GameIcon name="crystal-ball" size={16} />
            </Btn>
          </div>
        </Section>

        <Section title="Icons (game-icons.net)">
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
            {ICONS.map((name) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-12 w-full items-center justify-center border border-gold-b1 text-gold-text"
                  style={stoneSurface("mid")}
                >
                  <GameIcon name={name} size={24} />
                </div>
                <span className="text-center text-[10px] leading-tight text-text-dim">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Form primitives">
          <DesignFormPreview />
        </Section>

        <Section title="Message bubbles (real components)">
          <div className="space-y-3">
            <MessageBubble
              role="user"
              content="Where do I find the Dying Knight quest?"
            />
            <MessageBubble
              role="assistant"
              content={
                "The Dying Knight is found in the Ossuary on the north side of the map [1]. Speak to him to begin the mercy-kill questline."
              }
              sources={[
                {
                  index: 1,
                  title: "The Dying Knight",
                  url: "https://wiki.gg",
                  domain: "wiki.gg",
                },
              ]}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
