export interface OceanFact {
  id: string;
  stat: string;
  headline: string;
  detail: string;
  source: { label: string; url: string };
}

/** Every source URL here was checked as reachable when the dataset was built. */
export const OCEAN_FACTS: OceanFact[] = [
  {
    id: "oxygen",
    stat: "50%",
    headline: "At least half the oxygen you breathe comes from the ocean",
    detail:
      "Plankton, drifting plants and photosynthesising bacteria in the surface ocean produce at least fifty percent of Earth's oxygen — most of it from organisms too small to see.",
    source: { label: "NOAA Ocean Service", url: "https://oceanservice.noaa.gov/facts/ocean-oxygen.html" },
  },
  {
    id: "unexplored",
    stat: "80%",
    headline: "Most of the ocean has never been mapped or explored",
    detail:
      "More than eighty percent of the ocean remains unmapped, unobserved and unexplored. We have better maps of the surface of Mars than of our own seafloor.",
    source: { label: "NOAA Ocean Service", url: "https://oceanservice.noaa.gov/facts/exploration.html" },
  },
  {
    id: "overfished",
    stat: "35%",
    headline: "Around a third of assessed fish stocks are overfished",
    detail:
      "The FAO estimates that roughly 35% of the world's assessed marine fish stocks are being fished beyond biologically sustainable limits — which is exactly why 'not endangered' does not mean 'fine to catch'.",
    source: {
      label: "FAO State of World Fisheries and Aquaculture",
      url: "https://www.fao.org/state-of-fisheries-aquaculture",
    },
  },
  {
    id: "reefs",
    stat: "25%",
    headline: "Coral reefs shelter a quarter of all marine species",
    detail:
      "Reefs cover less than one percent of the seafloor yet support around a quarter of all marine life. Rising sea temperatures cause the coral to expel the algae it depends on, leaving it bleached and vulnerable.",
    source: { label: "NOAA Ocean Service", url: "https://oceanservice.noaa.gov/facts/coral_bleach.html" },
  },
  {
    id: "seagrass",
    stat: "Blue carbon",
    headline: "Seagrass meadows are among the ocean's best carbon stores",
    detail:
      "Seagrass traps carbon in its sediments, stabilises the seabed and shelters juvenile fish. Grazing green turtles keep those meadows cropped and productive — protect the turtle and you protect the carbon store.",
    source: { label: "NOAA Ocean Service", url: "https://oceanservice.noaa.gov/facts/seagrass.html" },
  },
  {
    id: "mpa",
    stat: "~8%",
    headline: "Only about 8% of the ocean is under protection",
    detail:
      "Marine protected areas cover roughly eight percent of the ocean, and only a fraction of that is fully protected from extraction. The international target is thirty percent by 2030.",
    source: { label: "Protected Planet", url: "https://protectedplanet.net/marine" },
  },
];

/** Deterministic weekly rotation so the featured species is stable during a demo. */
export function weekIndex(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const days = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return Math.floor(days / 7);
}
