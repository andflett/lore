"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { stoneSurface } from "@/lib/surfaces";
import { GameIcon } from "@/components/shared/GameIcon";
import { IconButton } from "@/components/shared/IconButton";
import { Sidebar } from "@/components/sidebar/Sidebar";

interface Props {
  children: ReactNode;
  activePlaythroughId?: string;
}

// Layout skeleton: header bar, sidebar (drawer on mobile, fixed on desktop), main panel.
// Rendered from the playthrough layout so it persists across session navigation.
// Page-specific header buttons mount into the #header-actions slot via a portal
// (see HeaderActions), and the sidebar reads the active session from the URL
// itself — so nothing here needs per-session props that would force a re-render.
export function AppShell({ children, activePlaythroughId }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-stone-s0">
      <header
        className="flex h-16 items-center justify-between border-b-2 border-gold-b2 px-3"
        style={stoneSurface("recessed")}
      >
        <div className="flex items-center gap-3">
          {/* Mobile: the playthroughs toggle doubles as the brand glyph. */}
          <span className="md:hidden">
            <IconButton
              icon="quill-ink"
              label="Playthroughs"
              size="sm"
              tooltipAlign="start"
              onClick={() => setDrawerOpen(true)}
            />
          </span>
          {/* Desktop: dedicated brand mark beside the wordmark. */}
          <span className="hidden items-center gap-2 md:flex">
            <GameIcon name="quill-ink" size={16} className="text-gold" />
          </span>
          <span
            className="font-ui text-[11px] uppercase text-text-t3"
            style={{ letterSpacing: "0.2em" }}
          >
            Wyrdscribe
          </span>
        </div>
        {/* Portal target for page-specific header buttons (HeaderActions). */}
        <div id="header-actions" className="flex items-center gap-2" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-72 shrink-0 border-r-2 border-gold-b2 md:block"
          style={stoneSurface("recessed")}
        >
          <Sidebar activePlaythroughId={activePlaythroughId} />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-30 bg-black/60 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-40 w-72 border-r-2 border-gold-b2 md:hidden"
                style={stoneSurface("recessed")}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.18 }}
              >
                <Sidebar
                  activePlaythroughId={activePlaythroughId}
                  onNavigate={() => setDrawerOpen(false)}
                  onClose={() => setDrawerOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
