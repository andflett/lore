import { use, type ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

// This layout owns the persistent chrome (header + sidebar) for a playthrough.
// Because a layout's subtree is preserved across navigations within the same
// [id] segment, switching sessions (…/session/[sessionId]) no longer remounts
// the sidebar — its live queries stay subscribed instead of refetching on
// every click. The page below renders only the session content, plus its
// header buttons into the shell's #header-actions portal slot.
export default function PlaythroughLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AppShell activePlaythroughId={id}>{children}</AppShell>;
}
