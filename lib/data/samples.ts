import type { ScanRecord } from "@/lib/types";
import { getSpecies } from "@/lib/data/species";
import { resolveStatusCode } from "@/lib/conservation";

/**
 * Photos the Dive page can send straight into the identify flow (`/identify?sample=crab`).
 * Each runs through the same live pipeline as an upload. `saved` is the result Gemini gave
 * for that exact photo when it was added — shown, labelled as a demo scan, only when the
 * live service can't be reached, so a presentation never stalls on venue wifi.
 */
export interface SamplePhoto {
  photo: string;
  saved: Pick<ScanRecord, "slug" | "commonName" | "scientificName" | "confidence" | "alternatives" | "reasoning" | "hints">;
}

export const SAMPLES: Record<string, SamplePhoto> = {
  crab: {
    photo: "/dive/story/crab.jpg",
    // Recorded from gemini-flash-latest on 2026-09-26.
    saved: {
      slug: "blue-crab",
      commonName: "Blue Crab",
      scientificName: "Callinectes sapidus",
      confidence: 95,
      alternatives: ["Green Crab"],
      reasoning:
        "The crab has bright blue coloration on the legs and large lateral spines on the carapace, which are characteristic features of the blue crab.",
      hints: { eggs: "unknown", sex: "unknown" },
    },
  },
};

export function getSample(id: string | undefined) {
  return id ? (SAMPLES[id] ?? null) : null;
}

/** The fallback scan record for a sample, with its conservation status read from the dataset. */
export function buildSavedScan(sample: SamplePhoto): ScanRecord {
  const species = sample.saved.slug ? getSpecies(sample.saved.slug) : undefined;
  return {
    id: `saved-${sample.saved.slug}`,
    ...sample.saved,
    statusCode: species ? resolveStatusCode(species) : undefined,
    photo: sample.photo,
    source: "demo",
    createdAt: Date.now(),
  };
}
