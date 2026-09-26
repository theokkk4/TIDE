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
    slug: "blue-crab",
    confidence: 94,
    alternatives: ["Lady Crab", "European Green Crab"],
    reasoning:
      "Flattened rear swimming paddles, a row of lateral spines ending in one long spike on each side, and blue claw joints point to Callinectes sapidus.",
    hook: "Keep or release? Size, eggs and sex",
  },
  {
    slug: "striped-bass",
    confidence: 92,
    alternatives: ["White Perch", "White Bass"],
    reasoning:
      "Seven or eight unbroken dark stripes running the length of a silvery body, two separate dorsal fins and a large mouth — Morone saxatilis.",
    hook: "Inside the slot — or over it?",
  },
  {
    slug: "northern-snakehead",
    confidence: 88,
    alternatives: ["Bowfin", "Burbot"],
    reasoning:
      "A long, cylindrical body with a single long dorsal fin, blotchy python-like markings and scales on the head — the scaled head rules out the native bowfin.",
    hook: "Invasive — don't put it back",
  },
  {
    slug: "eastern-box-turtle",
    confidence: 95,
    alternatives: ["Wood Turtle", "Spotted Turtle"],
    reasoning:
      "A high, domed shell with yellow-orange blotches and a hinged lower shell that closes completely — Terrapene carolina.",
    hook: "Found one on the road?",
  },
  {
    slug: "eastern-hellbender",
    confidence: 90,
    alternatives: ["Common Mudpuppy"],
    reasoning:
      "A flat head and body, loose wrinkled skin folds along the flanks and tiny eyes — Cryptobranchus alleganiensis, without the external gills a mudpuppy has.",
    hook: "Protected in PA — leave it",
  },
  {
    slug: "green-sea-turtle",
    confidence: 96,
    alternatives: ["Hawksbill Sea Turtle", "Loggerhead Sea Turtle"],
    reasoning:
      "Smooth, non-overlapping carapace scutes in four pairs, a single pair of prefrontal scales, and a blunt, rounded beak — all diagnostic of Chelonia mydas rather than the pointed beak of a hawksbill.",
    hook: "Least Concern — and still protected",
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
