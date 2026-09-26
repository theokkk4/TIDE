import { SPECIES } from "@/lib/data/species";
import { DATA_RETRIEVED_AT, getMediaImage, speciesImage, speciesImageCredit } from "@/lib/conservation";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { SectionHeading } from "@/components/ui/primitives";
import { PageTransition } from "@/components/ui/motion";

export const metadata = {
  title: "Photo credits — TIDE",
};

const MEDIA_LABELS: Record<string, string> = {
  "hero-reef": "Coral reef (home screen)",
  "hero-kelp": "Kelp forest",
  "hero-seagrass": "Seagrass meadow",
  "pan-fried": "Pan-fried fish",
  "grilled-whole": "Grilled whole fish",
  "salmon-dish": "Salmon sashimi",
  "seafood-boil": "Seafood boil",
  pulpo: "Pulpo a la gallega",
};

const MEDIA_KEYS = [
  "hero-reef",
  "hero-kelp",
  "hero-seagrass",
  "pan-fried",
  "fish-and-chips",
  "bouillabaisse",
  "sashimi",
  "fish-taco",
  "ceviche",
  "grilled-whole",
  "poke",
  "chowder",
  "cioppino",
  "paella",
  "seafood-boil",
  "crab-cake",
  "lobster-roll",
  "calamari",
  "pulpo",
  "salmon-dish",
];

function label(key: string) {
  return MEDIA_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replaceAll("-", " ");
}

function CreditRow({ image, name, credit }: { image: string | null; name: string; credit: string | null }) {
  return (
    <li className="flex items-center gap-3 border-b border-foam/8 py-3 last:border-0">
      <SpeciesPhoto src={image} alt="" className="h-11 w-11 shrink-0 rounded-xl" sizes="44px" />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-foam">{name}</p>
        <p className="text-[12px] leading-relaxed text-mist">{credit ?? "Credit unavailable"}</p>
      </div>
    </li>
  );
}

export default function CreditsPage() {
  const media = MEDIA_KEYS.map((key) => ({ key, record: getMediaImage(key) })).filter(({ record }) => record);

  return (
    <PageTransition>
      <header className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-turquoise/80 uppercase">Credits</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight text-foam">Photo credits</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mist">
          Every photograph in TIDE comes from Wikimedia Commons and is used under the licence shown. Credits were
          retrieved with the images on {DATA_RETRIEVED_AT}.
        </p>
      </header>

      <section className="mt-8 px-6">
        <SectionHeading title="Species" />
        <ul className="glass rounded-[22px] px-4">
          {SPECIES.map((species) => (
            <CreditRow
              key={species.slug}
              image={speciesImage(species)}
              name={species.commonName}
              credit={speciesImageCredit(species)}
            />
          ))}
        </ul>
      </section>

      <section className="mt-8 px-6">
        <SectionHeading title="Dishes and scenes" />
        <ul className="glass rounded-[22px] px-4">
          {media.map(({ key, record }) => (
            <CreditRow key={key} image={record?.image ?? null} name={label(key)} credit={record?.credit ?? null} />
          ))}
        </ul>
      </section>
    </PageTransition>
  );
}
