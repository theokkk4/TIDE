"use client";

import { useEffect, useState } from "react";
import { Database, Loader2, WifiOff } from "lucide-react";
import type { GbifEnrichment } from "@/lib/types";
import { formatCount } from "@/lib/utils";

/**
 * Re-verifies the species against GBIF in the browser. If the network is unavailable,
 * the cached figures stay on screen and the badge says so rather than failing.
 */
export function LiveDataBadge({
  scientificName,
  slug,
  cachedCount,
  retrievedAt,
}: {
  scientificName: string;
  slug: string;
  cachedCount: number | null;
  retrievedAt: string;
}) {
  const [state, setState] = useState<"checking" | "live" | "cached">("checking");
  const [count, setCount] = useState<number | null>(cachedCount);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/enrich?name=${encodeURIComponent(scientificName)}&slug=${slug}`)
      .then((response) => response.json() as Promise<GbifEnrichment>)
      .then((data) => {
        if (cancelled) return;
        setCount(data.occurrenceCount ?? cachedCount);
        setState(data.live ? "live" : "cached");
      })
      .catch(() => {
        if (!cancelled) setState("cached");
      });

    return () => {
      cancelled = true;
    };
  }, [scientificName, slug, cachedCount]);

  return (
    <div className="mx-6 flex items-center gap-2.5 rounded-2xl border border-foam/8 bg-foam/[0.04] px-4 py-2.5">
      {state === "checking" ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-mist" aria-hidden />
      ) : state === "live" ? (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-safe opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-status-safe" />
        </span>
      ) : (
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-mist" aria-hidden />
      )}

      <p className="flex-1 text-[11px] leading-relaxed text-mist">
        {state === "checking" && "Verifying against GBIF…"}
        {state === "live" && (
          <>
            Verified live against GBIF
            {count !== null && ` · ${formatCount(count)} occurrence records`}
          </>
        )}
        {state === "cached" && (
          <>
            Offline — using data cached {retrievedAt}
            {count !== null && ` · ${formatCount(count)} records`}
          </>
        )}
      </p>

      <Database className="h-3.5 w-3.5 shrink-0 text-mist/50" aria-hidden />
    </div>
  );
}
