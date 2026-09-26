import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SPECIES, getSpecies } from "@/lib/data/species";
import {
  DATA_RETRIEVED_AT,
  buildSources,
  getVerified,
  resolveStatus,
  resolveStatusCode,
  speciesImage,
  speciesImageCredit,
} from "@/lib/conservation";
import { getSeafoodVerdict } from "@/lib/seafood";
import { getRecipesFor } from "@/lib/data/recipes";
import { getAlternatives } from "@/lib/data/alternatives";
import { SpeciesHero } from "@/components/species/species-hero";
import { ScanSummary } from "@/components/species/scan-summary";
import { LiveDataBadge } from "@/components/species/live-data";
import {
  AboutCard,
  ConservationCard,
  HumanImpactCard,
  SeafoodCard,
  SourcesCard,
  ThreatsCard,
} from "@/components/species/panels";
import { AlternativesSection, RecipeSection } from "@/components/species/seafood-sections";
import { Reveal } from "@/components/ui/motion";
import { KeepOrRelease } from "@/components/species/keep-or-release";
import { FoundIt } from "@/components/species/found-it";
import { encounterMode } from "@/lib/decision";
import { ButtonLink } from "@/components/ui/primitives";

export function generateStaticParams() {
  return SPECIES.map((species) => ({ slug: species.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const species = getSpecies(slug);
  if (!species) return { title: "Species — TIDE" };

  const status = resolveStatus(species);
  return {
    title: `${species.commonName} — TIDE`,
    description: `${species.commonName} (${species.scientificName}) is assessed as ${status.label}. ${species.seafoodSummary}`,
  };
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const species = getSpecies(slug);
  if (!species) notFound();

  const status = resolveStatus(species);
  const statusCode = resolveStatusCode(species);
  const verdict = getSeafoodVerdict(species, statusCode);
  const verified = getVerified(species.slug);
  const recipes = verdict.showRecipes ? getRecipesFor(species) : [];
  const alternatives = getAlternatives(species.alternatives);
  const sources = buildSources(species);

  const alternativeReason = species.legallyProtected
    ? `${species.commonName} is protected and must not be taken. These are lower-impact choices that are not.`
    : verdict.key === "SUSTAINABILITY_CONCERN"
      ? `While ${species.commonName} stocks recover, these choices carry a lighter footprint.`
      : "Lower-impact choices that are widely available.";

  return (
    <article className="pb-6">
      <SpeciesHero
        slug={species.slug}
        commonName={species.commonName}
        scientificName={species.scientificName}
        emoji={species.emoji}
        statusCode={statusCode}
        stockPhoto={speciesImage(species)}
        photoCredit={speciesImageCredit(species)}
      />

      <div className="mt-4 space-y-4">
        <ScanSummary slug={species.slug} />

        {encounterMode(species) === "catch" ? (
          <KeepOrRelease species={species} edible={verdict.showRecipes} />
        ) : (
          <FoundIt species={species} />
        )}

        <LiveDataBadge
          scientificName={species.scientificName}
          slug={species.slug}
          cachedCount={verified?.occurrenceCount ?? null}
          retrievedAt={DATA_RETRIEVED_AT}
        />

        <Reveal className="px-6">
          <ConservationCard species={species} status={status} />
        </Reveal>

        <Reveal className="px-6" delay={0.05}>
          <SeafoodCard species={species} verdict={verdict} />
        </Reveal>

        <div className="space-y-3 px-6">
          <Reveal delay={0.05}>
            <AboutCard species={species} />
          </Reveal>
          <Reveal delay={0.08}>
            <ThreatsCard species={species} />
          </Reveal>
          <Reveal delay={0.11}>
            <HumanImpactCard species={species} />
          </Reveal>
          <Reveal delay={0.14}>
            <SourcesCard sources={sources} retrievedAt={DATA_RETRIEVED_AT} />
          </Reveal>
        </div>
      </div>

      {verdict.showRecipes && recipes.length > 0 && (
        <RecipeSection
          recipes={recipes}
          speciesName={species.marketName ?? species.commonName}
          advisory={verdict.sourcingAdvisory}
        />
      )}

      {verdict.showAlternatives && (
        <AlternativesSection alternatives={alternatives} reason={alternativeReason} />
      )}

      <div className="mt-10 px-6">
        <ButtonLink href="/identify" variant="secondary" className="w-full">
          Identify another species
        </ButtonLink>
      </div>
    </article>
  );
}
