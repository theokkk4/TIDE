import type { IucnCode, Source, Species, VerifiedRecord } from "@/lib/types";
import { statusFromCode, type StatusMeta } from "@/lib/status";
import verified from "@/lib/data/generated/verified.json";

export { STATUS_META, TONE_CLASSES, isThreatened, statusFromCode } from "@/lib/status";
export type { StatusMeta } from "@/lib/status";

const VERIFIED = verified as unknown as {
  retrievedAt: string;
  species: Record<string, (VerifiedRecord & { noaaUrl?: string | null }) | null>;
  media: Record<string, { image: string; credit: string | null }>;
};

export const DATA_RETRIEVED_AT = VERIFIED.retrievedAt;

export function getVerified(slug: string) {
  return VERIFIED.species?.[slug] ?? null;
}

/** Dish and scene photography, keyed by the identifiers used in the sync script. */
export function getMediaImage(key: string) {
  return VERIFIED.media?.[key] ?? null;
}

/** Live-verified assessment wins; the curated code is the offline fallback. */
export function resolveStatus(species: Species, liveCode?: IucnCode | null): StatusMeta {
  const code = liveCode ?? (getVerified(species.slug)?.iucnCode as IucnCode | null) ?? species.iucnCode;
  return statusFromCode(code);
}

export function resolveStatusCode(species: Species, liveCode?: IucnCode | null): IucnCode {
  return liveCode ?? (getVerified(species.slug)?.iucnCode as IucnCode | null) ?? species.iucnCode;
}

export function speciesImage(species: Species) {
  return getVerified(species.slug)?.image ?? null;
}

export function speciesImageCredit(species: Species) {
  return getVerified(species.slug)?.imageCredit ?? null;
}

/**
 * Builds the clickable source list. Generated links point at pages that were reachable
 * when the data was synced, so nothing here is a guessed URL.
 */
export function buildSources(species: Species): Source[] {
  const record = getVerified(species.slug);
  const sources: Source[] = [
    {
      label: `IUCN Red List assessment — ${species.scientificName}`,
      org: "IUCN Red List",
      url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(species.scientificName)}&searchType=species`,
    },
  ];

  if (record?.gbifKey) {
    sources.push({
      label: `GBIF occurrence records${record.occurrenceCount ? ` (${record.occurrenceCount.toLocaleString()})` : ""}`,
      org: "GBIF",
      url: `https://www.gbif.org/species/${record.gbifKey}`,
    });
  }

  if (record?.noaaUrl) {
    sources.push({ label: "NOAA Fisheries species profile", org: "NOAA Fisheries", url: record.noaaUrl });
  }

  if (record?.wikipediaUrl) {
    sources.push({ label: "Wikipedia — species overview", org: "Wikipedia", url: record.wikipediaUrl });
  }

  return [...sources, ...(species.sources ?? [])];
}
