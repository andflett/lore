"use client";

import type { ReactNode } from "react";
import { Tooltip } from "@base-ui-components/react/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return <Tooltip.Provider delay={300}>{children}</Tooltip.Provider>;
}
