import type { SourcedStat } from "./content";

/**
 * Published numbers about the people and animals TIDE is for — the real-world side of the
 * outcomes section. Every one of these is sourced; the projections next to them are not.
 */
export const BASELINES: SourcedStat[] = [
  {
    value: "57.9M",
    label: "Americans went fishing in 2024, a record",
    source: "RBFF, 2025 Special Report on Fishing",
    url: "https://www.takemefishing.org/corporate/resource-center/research/fishing-boating-research/",
  },
  {
    value: "1.1B",
    label: "fish were caught by US saltwater anglers in 2023, and 65% of them were released",
    source: "NOAA Fisheries, Fisheries of the United States",
    url: "https://www.fisheries.noaa.gov/national/sustainable-fisheries/fisheries-united-states",
  },
  {
    value: "41%",
    label: "of amphibian species are threatened with extinction",
    source: "IUCN Global Amphibian Assessment, Nature 2023",
    url: "https://www.nature.com/articles/s41586-023-06578-4",
  },
  {
    value: "54%",
    label: "of turtle and tortoise species are threatened",
    source: "IUCN Tortoise and Freshwater Turtle Specialist Group, 2025",
    url: "https://iucn-tftsg.org/checklist/",
  },
];
