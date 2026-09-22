import type { ScanRecord } from "@/lib/types";
import { getSpecies } from "@/lib/data/species";
import { getVerified, resolveStatusCode } from "@/lib/conservation";

export interface DemoScan {
  slug: string;
  confidence: number;
  alternatives: string[];
  reasoning: string;
  /** One line on the card telling a judge what this example demonstrates. */
  hook: string;
}

/**
 * Demo Mode replays the full identification experience without touching the network,
 * so the story still lands if the venue wifi, the camera permission or the AI API
 * fails during judging.
 */
export const DEMO_SCANS: DemoScan[] = [
  {
    slug: "green-sea-turtle",
    confidence: 96,
    alternatives: ["Hawksbill Sea Turtle", "Loggerhead Sea Turtle"],
    reasoning:
      "Smooth, non-overlapping carapace scutes in four pairs, a single pair of prefrontal scales, and a blunt, rounded beak — all diagnostic of Chelonia mydas rather than the pointed beak of a hawksbill.",
    hook: "Least Concern — and still protected",
  },
  {
    slug: "blue-crab",
    confidence: 82,
    alternatives: ["Jonah Crab", "Dungeness Crab"],
    reasoning:
      "Flattened rear swimming paddles, nine lateral spines along each side of the carapace and bright blue claw articulation point to Callinectes sapidus.",
    hook: "Explore seafood information",
  },
  {
    slug: "common-octopus",
    confidence: 91,
    alternatives: ["Caribbean Reef Octopus", "Giant Pacific Octopus"],
    reasoning:
      "Eight arms with two rows of suckers, a bulbous mantle and mottled skin texture held against a rocky den — consistent with Octopus vulgaris.",
    hook: "Discover a marine species",
  },
  {
    slug: "atlantic-cod",
    confidence: 88,
    alternatives: ["Haddock", "Pollock"],
    reasoning:
      "Three dorsal fins, a prominent chin barbel and a pale lateral line curving over the pectoral fin — the classic Gadus morhua profile.",
    hook: "Where status and sustainability split",
  },
  {
    slug: "atlantic-bluefin-tuna",
    confidence: 93,
    alternatives: ["Yellowfin Tuna", "Albacore"],
    reasoning:
      "Deep, torpedo-shaped body with short pectoral fins and dark metallic blue dorsal colouring fading to silver — Thunnus thynnus rather than the long-finned yellowfin.",
    hook: "Not endangered, still avoid",
  },
];

export function getDemoScan(slug: string): DemoScan | null {
  return DEMO_SCANS.find((scan) => scan.slug === slug) ?? null;
}

/** Builds the scan record the results page consumes, using the curated species photo. */
export function buildDemoScanRecord(demo: DemoScan): ScanRecord | null {
  const species = getSpecies(demo.slug);
  if (!species) return null;

  return {
    id: `demo-${demo.slug}`,
    slug: species.slug,
    commonName: species.commonName,
    scientificName: species.scientificName,
    confidence: demo.confidence,
    statusCode: resolveStatusCode(species),
    photo: getVerified(species.slug)?.image ?? null,
    alternatives: demo.alternatives,
    reasoning: demo.reasoning,
    source: "demo",
    createdAt: Date.now(),
  };
}
