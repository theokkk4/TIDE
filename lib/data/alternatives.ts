export interface Alternative {
  id: string;
  name: string;
  badge: string;
  why: string;
  detail: string;
  /** Links through to a TIDE species page where one exists. */
  speciesSlug?: string;
  dishKey?: string;
}

/**
 * Shown instead of recipes when a species is protected, or when sustainable-seafood
 * guidance is to avoid it. The goal is a useful next step, not a lecture.
 */
export const ALTERNATIVES: Alternative[] = [
  {
    id: "mussels",
    name: "Farmed Mussels & Clams",
    badge: "Filter feeders",
    why: "Need no feed, no fresh water and no antibiotics.",
    detail:
      "Rope-grown mussels feed themselves by filtering plankton, and a mussel farm measurably improves the clarity of the water around it. Among the lowest-impact animal protein available anywhere.",
    dishKey: "cioppino",
  },
  {
    id: "sardines",
    name: "Sardines & Anchovies",
    badge: "Low on the food chain",
    why: "High in omega-3, very low in mercury, and abundant.",
    detail:
      "Small pelagic fish reproduce fast and eat plankton rather than other fish, so a kilo on your plate costs the ocean a fraction of what a kilo of tuna does.",
    speciesSlug: "european-sardine",
    dishKey: "grilled-whole",
  },
  {
    id: "alaska-salmon",
    name: "Wild Alaska Salmon",
    badge: "Rigorously managed",
    why: "Sockeye, pink and coho from one of the best-run fisheries on Earth.",
    detail:
      "Alaska writes sustainable fisheries management into its state constitution. Escapement targets ensure enough fish reach the spawning grounds before any commercial harvest is allowed.",
    dishKey: "salmon-dish",
  },
  {
    id: "pollock",
    name: "Alaska Pollock",
    badge: "Certified whitefish",
    why: "The direct substitute for cod in almost any recipe.",
    detail:
      "The largest certified-sustainable whitefish fishery in the world, with full catch monitoring. It is what most fish sandwiches and fish fingers are already made from.",
    dishKey: "fish-and-chips",
  },
  {
    id: "trout",
    name: "US Farmed Rainbow Trout",
    badge: "Closed systems",
    why: "Freshwater raceways with controlled effluent and no sea lice.",
    detail:
      "Rainbow trout farmed in land-based systems avoids the escape and parasite problems of coastal net pens, and the feed conversion ratio is among the best in aquaculture.",
    dishKey: "salmon-dish",
  },
  {
    id: "plant-based",
    name: "Plant-Based Seafood",
    badge: "Zero bycatch",
    why: "No fishing gear, no habitat impact, no bycatch at all.",
    detail:
      "Konjac, pea protein and algae-oil products have improved enormously, particularly for shrimp and tuna substitutes in composed dishes where texture is carried by the rest of the recipe.",
    dishKey: "poke",
  },
];

export function getAlternatives(preferredSlugs?: string[]): Alternative[] {
  if (!preferredSlugs?.length) return ALTERNATIVES;
  const preferred = ALTERNATIVES.filter((alt) => alt.speciesSlug && preferredSlugs.includes(alt.speciesSlug));
  const rest = ALTERNATIVES.filter((alt) => !preferred.includes(alt));
  return [...preferred, ...rest];
}
