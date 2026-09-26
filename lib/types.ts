export type IucnCode = "LC" | "NT" | "VU" | "EN" | "CR" | "EW" | "EX" | "DD" | "NE";

export type SpeciesCategory =
  | "turtle"
  | "fish"
  | "shark"
  | "crustacean"
  | "cephalopod"
  | "mammal"
  | "ray"
  | "amphibian"
  | "other";

/**
 * How people meet an animal decides what TIDE leads with. Anglers and crabbers "catch"
 * and need a keep-or-release call; hikers and drivers "find" and need to know what to do.
 */
export type EncounterMode = "catch" | "find";

/** How a size limit is measured, so the app can show the right diagram. */
export type MeasureMethod = "total-length" | "point-to-point" | "carapace-length" | "curved-carapace";

/**
 * Seafood state is deliberately separate from conservation status: a species can be
 * globally Least Concern and still be illegal, unsustainable or simply not eaten.
 */
export type SeafoodClass =
  | "PROTECTED"
  | "NOT_COMMONLY_CONSUMED"
  | "COMMONLY_CONSUMED"
  | "SUSTAINABILITY_CONCERN";

export type PreparationProfile =
  | "flaky-white"
  | "oily-rich"
  | "steak-fish"
  | "crustacean"
  | "cephalopod"
  | "small-oily";

export interface Source {
  label: string;
  org: "IUCN Red List" | "GBIF" | "NOAA Fisheries" | "Seafood Watch" | "CITES" | "Wikipedia";
  url: string;
}

export interface Threat {
  title: string;
  detail: string;
}

export interface Species {
  slug: string;
  commonName: string;
  scientificName: string;
  /** Name used inside recipe titles, e.g. "Cod" in "Garlic Butter Cod". */
  marketName?: string;
  category: SpeciesCategory;
  emoji: string;
  /** Curated fallback used when live IUCN data is unavailable. Verified against GBIF at build time. */
  iucnCode: IucnCode;
  statusContext: string;
  seafoodClass: SeafoodClass;
  seafoodSummary: string;
  /**
   * Explicit consumption advice for species under sustainability concern.
   * "avoid" suppresses recipes and surfaces alternatives instead.
   */
  consumptionGuidance?: "choose-carefully" | "avoid";
  /** Regional management / fishing status, which is distinct from global conservation status. */
  fishingStatus?: string;
  sourcingTips?: string[];
  legallyProtected: boolean;
  protectionNote?: string;
  habitat: string;
  range: string;
  size: string;
  diet: string;
  lifespan?: string;
  facts: string[];
  threats: Threat[];
  humanImpact: string;
  preparation?: PreparationProfile;
  /** Slugs of TIDE species suggested as lower-impact choices. */
  alternatives?: string[];
  /** Extra hand-written sources merged with the generated IUCN/GBIF/Wikipedia links. */
  sources?: Source[];
  /** NOAA Fisheries page slug, validated during data sync so no dead links ship. */
  noaaSlug?: string;
  /** Search terms the vision model may return that should resolve to this species. */
  aliases?: string[];
  /** Overrides the default mode (turtles and amphibians are found; everything else is caught). */
  encounter?: EncounterMode;
  /** Non-native and harmful here: releasing it alive is the wrong call. */
  invasive?: string;
  /** Checks that apply before any state rule: egg-bearing females go back. */
  eggCheck?: boolean;
  /** How to measure it against a size limit. */
  measure?: MeasureMethod;
  /** Handling advice once the call is made. */
  keepTips?: string[];
  releaseTips?: string[];
  /** For found animals: what to do right now, in order. */
  findSteps?: string[];
  /** Hazards to the finder (bites, toxins, Salmonella). */
  safety?: string[];
  /** Where sightings or incidents should be reported. */
  report?: { label: string; url: string };
}

export interface VerifiedRecord {
  gbifKey: number | null;
  iucnCode: IucnCode | null;
  iucnCategory: string | null;
  iucnTaxonId: string | null;
  occurrenceCount: number | null;
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
  };
  image: string | null;
  imageCredit: string | null;
  wikipediaUrl: string | null;
  summary: string | null;
}

export interface VerifiedData {
  retrievedAt: string;
  species: Record<string, VerifiedRecord>;
}

/** Structured output contract for the vision model. */
export interface AiIdentification {
  species_common_name: string;
  scientific_name: string;
  confidence: number;
  animal_type: string;
  visual_reasoning: string;
  possible_alternatives: string[];
  /** Fish, shellfish, turtles, amphibians and other aquatic or shoreline animals. */
  is_supported_animal: boolean;
  /** Crabs and lobsters only: an egg mass ("sponge") visible under the body. */
  egg_mass_visible?: "yes" | "no" | "unknown";
  /** Crabs only, when the apron or claw tips show it. */
  crab_sex?: "male" | "female" | "unknown";
}

export interface MatchedSpeciesSummary {
  slug: string;
  commonName: string;
  scientificName: string;
  statusCode: IucnCode;
  emoji: string;
}

export interface IdentifyResponse {
  ok: boolean;
  identification: AiIdentification | null;
  /** Slug of the matched TIDE species, null when the animal is outside the curated dataset. */
  matchedSlug: string | null;
  /** Curated naming and status, resolved server-side so the client needs no dataset. */
  matched?: MatchedSpeciesSummary | null;
  source: "ai" | "demo";
  error?: "no_credentials" | "provider_error" | "not_supported" | "unreadable";
  message?: string;
}

export interface GbifEnrichment {
  gbifKey: number | null;
  acceptedName: string | null;
  rank: string | null;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
  };
  occurrenceCount: number | null;
  iucnCode: IucnCode | null;
  live: boolean;
}

export interface ScanRecord {
  id: string;
  slug: string | null;
  commonName: string;
  scientificName: string;
  confidence: number;
  /** Denormalised so history cards render without loading the species dataset. */
  statusCode?: IucnCode;
  /** Data URL for captured photos, or a bundled path for demo scans. */
  photo: string | null;
  alternatives: string[];
  reasoning?: string;
  /** What the photo suggested about eggs and sex — prompts for the user to confirm, never a verdict. */
  hints?: { eggs?: "yes" | "no" | "unknown"; sex?: "male" | "female" | "unknown" };
  source: "ai" | "demo";
  createdAt: number;
}

export interface Recipe {
  id: string;
  title: string;
  blurb: string;
  time: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  serves: string;
  ingredients: string[];
  steps: string[];
  image: string;
}
