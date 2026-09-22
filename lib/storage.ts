"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { IucnCode, ScanRecord } from "@/lib/types";

const SAVED_KEY = "tide.saved.v1";
const RECENT_KEY = "tide.recent.v1";
const SCAN_KEY = "tide.scan.current.v1";
const CHANGE_EVENT = "tide:storage";

export interface SavedSpecies {
  slug: string;
  commonName: string;
  scientificName: string;
  statusCode: IucnCode;
  photo: string | null;
  savedAt: number;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
  } catch {
    /* Private mode or quota exceeded — the app keeps working without persistence. */
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * useSyncExternalStore needs a referentially stable snapshot, so parsed values are
 * cached against the raw string and only rebuilt when storage actually changes.
 */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function snapshot<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  snapshots.set(key, { raw, value });
  return value;
}

function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => fallback,
  );

  const update = useCallback((next: T) => write(key, next), [key]);

  return [value, update];
}

export function useSavedSpecies() {
  const [saved, setSaved] = useStored<SavedSpecies[]>(SAVED_KEY, []);

  const toggle = useCallback(
    (entry: Omit<SavedSpecies, "savedAt">) => {
      const exists = saved.some((item) => item.slug === entry.slug);
      setSaved(
        exists
          ? saved.filter((item) => item.slug !== entry.slug)
          : [{ ...entry, savedAt: Date.now() }, ...saved],
      );
      return !exists;
    },
    [saved, setSaved],
  );

  const remove = useCallback(
    (slug: string) => setSaved(saved.filter((item) => item.slug !== slug)),
    [saved, setSaved],
  );

  const isSaved = useCallback((slug: string) => saved.some((item) => item.slug === slug), [saved]);

  return { saved, toggle, remove, isSaved };
}

export function useRecentScans() {
  const [recent, setRecent] = useStored<ScanRecord[]>(RECENT_KEY, []);

  const add = useCallback(
    (scan: ScanRecord) => {
      const deduped = recent.filter((item) => item.id !== scan.id);
      setRecent([scan, ...deduped].slice(0, 12));
    },
    [recent, setRecent],
  );

  const clear = useCallback(() => setRecent([]), [setRecent]);

  return { recent, add, clear };
}

export function addRecentScan(scan: ScanRecord) {
  const existing = read<ScanRecord[]>(RECENT_KEY, []).filter((item) => item.id !== scan.id);
  write(RECENT_KEY, [scan, ...existing].slice(0, 12));
}

/**
 * The in-flight scan is handed from the identify flow to the results page.
 * sessionStorage keeps the captured photo out of localStorage, where it would
 * compete for quota with saved species.
 */
export function setCurrentScan(scan: ScanRecord) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SCAN_KEY, JSON.stringify(scan));
  } catch {
    /* Photo too large for the quota — the results page falls back to the stock image. */
  }
}

export function getCurrentScan(): ScanRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SCAN_KEY);
    return raw ? (JSON.parse(raw) as ScanRecord) : null;
  } catch {
    return null;
  }
}

/** The in-flight scan is written before navigation, so it never changes while mounted. */
const noopSubscribe = () => () => {};
let scanSnapshot: { raw: string | null; value: ScanRecord | null } | null = null;

function currentScanSnapshot(): ScanRecord | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(SCAN_KEY);
  } catch {
    return null;
  }
  if (scanSnapshot && scanSnapshot.raw === raw) return scanSnapshot.value;
  let value: ScanRecord | null = null;
  try {
    if (raw) value = JSON.parse(raw) as ScanRecord;
  } catch {
    value = null;
  }
  scanSnapshot = { raw, value };
  return value;
}

export function useCurrentScan() {
  return useSyncExternalStore(
    noopSubscribe,
    currentScanSnapshot,
    () => null,
  );
}

/** True once the client has taken over from the server-rendered markup. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Returns the in-flight scan only when it belongs to the species being viewed, so
 * browsing to a species from Discover shows the stock photo rather than a stale capture.
 */
export function useCurrentScanFor(slug: string | null) {
  const scan = useCurrentScan();
  if (!scan) return null;
  const matches = slug === "unknown" ? scan.slug === null : scan.slug === slug;
  return matches ? scan : null;
}

export function clearCurrentScan() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SCAN_KEY);
  } catch {
    /* no-op */
  }
}
