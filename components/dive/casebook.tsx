import Image from "next/image";
import Link from "next/link";
import { Lock, UtensilsCrossed } from "lucide-react";
import { getSpecies } from "@/lib/data/species";
import { getRecipesFor } from "@/lib/data/recipes";
import { resolveStatusCode, speciesImage } from "@/lib/conservation";
import { getSeafoodVerdict } from "@/lib/seafood";
import { TONE_CLASSES, statusFromCode } from "@/lib/status";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { PlaneReveal } from "./reveal";

/**
 * Five animals, five different answers. The status, the verdict and whether a recipe is
 * offered all come from the app's own logic, so this page can't say anything TIDE wouldn't.
 */
const CASES = [
  {
    slug: "green-sea-turtle",
    kind: "Protected",
    line: "Least Concern worldwide, and still protected by US law and CITES. Leave it, and call it in if it's hurt.",
  },
  {
    slug: "american-eel",
    kind: "Endangered",
    line: "Legal to keep in New Jersey at 9 inches, but Endangered worldwide. TIDE suggests letting it go.",
  },
  {
    slug: "blue-crab",
    kind: "Common seafood",
    line: "A keeper in New Jersey at 4½ inches point to point, as long as she isn't carrying eggs.",
    recipe: "blue-crab-cakes",
  },
  {
    slug: "striped-bass",
    kind: "Sustainability concern",
    line: "Least Concern, but closely managed: New Jersey allows one fish from 28 to just under 31 inches.",
    recipe: "striped-bass-beer-battered",
  },
  {
    slug: "northern-snakehead",
    kind: "Invasive",
    line: "Doing fine in its native Asia, invasive here. Don't put it back — and it's good eating.",
    recipe: "northern-snakehead-garlic-butter",
  },
];

export function Casebook() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CASES.flatMap(({ slug, kind, line, recipe: recipeId }, index) => {
        const species = getSpecies(slug);
        if (!species) return [];
        const code = resolveStatusCode(species);
        const verdict = getSeafoodVerdict(species, code);
        const tone = TONE_CLASSES[verdict.tone];
        const recipe = verdict.showRecipes ? getRecipesFor(species).find((r) => r.id === recipeId) : undefined;
        const image = speciesImage(species);
        return [
          <PlaneReveal key={slug} index={index} className="h-full">
            <article className="glass flex h-full flex-col overflow-hidden rounded-[24px]">
              <div className="relative h-32 w-full">
                {image && <Image src={image} alt={species.commonName} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover" />}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.1),rgba(2,8,20,0.85))]" />
                <span className="absolute top-3 left-3 rounded-full bg-abyss/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-foam uppercase backdrop-blur-sm">
                  {kind}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h3 className="text-[17px] leading-tight font-semibold text-foam">{species.commonName}</h3>
                  <div className="mt-2">
                    <StatusBadge status={statusFromCode(code)} size="sm" />
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-mist">{line}</p>
                <div className="mt-auto space-y-2 border-t border-foam/10 pt-3">
                  <p className={cn("flex items-center gap-1.5 text-[12px] font-semibold", tone.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden />
                    {verdict.headline}
                  </p>
                  {recipe ? (
                    <Link
                      href={`/species/${slug}`}
                      className="flex items-start gap-1.5 text-[12px] leading-snug text-status-safe hover:underline"
                    >
                      <UtensilsCrossed className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {recipe.title}
                    </Link>
                  ) : (
                    <p className="flex items-center gap-1.5 text-[12px] text-mist/70">
                      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      No recipes
                    </p>
                  )}
                </div>
              </div>
            </article>
          </PlaneReveal>,
        ];
      })}
    </div>
  );
}
