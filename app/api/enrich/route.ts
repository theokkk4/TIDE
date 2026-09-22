import { NextResponse } from "next/server";
import { getVerified } from "@/lib/conservation";
import type { GbifEnrichment, IucnCode } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Verifies a species against GBIF's live taxonomy and IUCN Red List mapping.
 * GBIF is keyless, so this needs no configuration — but a hackathon venue's wifi
 * is not something to trust, so every path falls back to the cached dataset.
 */

const GBIF_TIMEOUT_MS = 4000;

async function fetchJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GBIF responded ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const slug = searchParams.get("slug");

  const cached = slug ? getVerified(slug) : null;
  const fallback: GbifEnrichment = {
    gbifKey: cached?.gbifKey ?? null,
    acceptedName: null,
    rank: null,
    taxonomy: cached?.taxonomy ?? {},
    occurrenceCount: cached?.occurrenceCount ?? null,
    iucnCode: (cached?.iucnCode as IucnCode | null) ?? null,
    live: false,
  };

  if (!name) return NextResponse.json(fallback);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GBIF_TIMEOUT_MS);

  try {
    const match = await fetchJson(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`,
      controller.signal,
    );

    if (!match?.usageKey) return NextResponse.json(fallback);

    const [iucn, occurrences] = await Promise.allSettled([
      fetchJson(`https://api.gbif.org/v1/species/${match.usageKey}/iucnRedListCategory`, controller.signal),
      fetchJson(
        `https://api.gbif.org/v1/occurrence/search?taxonKey=${match.usageKey}&limit=0`,
        controller.signal,
      ),
    ]);

    const enrichment: GbifEnrichment = {
      gbifKey: match.usageKey,
      acceptedName: match.scientificName ?? null,
      rank: match.rank ?? null,
      taxonomy: {
        kingdom: match.kingdom,
        phylum: match.phylum,
        class: match.class,
        order: match.order,
        family: match.family,
      },
      occurrenceCount:
        occurrences.status === "fulfilled" && typeof occurrences.value?.count === "number"
          ? occurrences.value.count
          : fallback.occurrenceCount,
      iucnCode:
        iucn.status === "fulfilled" && iucn.value?.code ? (iucn.value.code as IucnCode) : fallback.iucnCode,
      live: true,
    };

    return NextResponse.json(enrichment);
  } catch {
    return NextResponse.json(fallback);
  } finally {
    clearTimeout(timeout);
  }
}
