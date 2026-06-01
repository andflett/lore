"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Subscribe to nothing: the store never changes, but useSyncExternalStore lets
// us return a client-only value (true) while always returning the server value
// (false) during SSR/hydration — no setState-in-effect needed.
const subscribe = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

// Mounts page-specific header buttons into the persistent shell's
// #header-actions slot (rendered by AppShell, which lives in the layout). This
// lets the page own its header content without the shell — and the sidebar
// inside it — being a child of the page that re-renders on every navigation.
export function HeaderActions({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getMounted, getServerMounted);
  if (!mounted) return null;
  const target = document.getElementById("header-actions");
  return target ? createPortal(children, target) : null;
}
