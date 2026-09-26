"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CatchDecision } from "@/lib/decision";

type Action = CatchDecision["action"];

const CatchVerdictContext = createContext<{ action: Action | null; setAction: (action: Action | null) => void } | null>(
  null,
);

/**
 * Shares the keep-or-release verdict with the recipes further down the page, so a crab
 * that has to go back doesn't come with a crab-cake recipe.
 */
export function CatchVerdictProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<Action | null>(null);
  return <CatchVerdictContext.Provider value={{ action, setAction }}>{children}</CatchVerdictContext.Provider>;
}

export function useCatchVerdict() {
  return useContext(CatchVerdictContext);
}
