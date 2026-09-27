"use client";

import { useEffect } from "react";
import { NEXT_KEYS, PREV_KEYS, PRESENTATION_KEY_MESSAGE, ownsArrowKeys } from "@/lib/dive/presentation";

/**
 * When the app runs inside the phone on /dive, keyboard focus is in this frame after a
 * tap, and the page around it would stop hearing the clicker. Hand those keys up.
 */
export function EmbedKeyBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || ownsArrowKeys(event.target)) return;
      if (!NEXT_KEYS.has(event.key) && !PREV_KEYS.has(event.key)) return;
      event.preventDefault();
      window.parent.postMessage({ type: PRESENTATION_KEY_MESSAGE, key: event.key }, window.location.origin);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
