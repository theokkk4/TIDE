import Link from "next/link";
import { ArrowRight, Camera, ImageUp } from "lucide-react";
import { ButtonLink, SectionHeading } from "@/components/ui/primitives";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { PageTransition, Reveal } from "@/components/ui/motion";
import { RecentIdentifications } from "@/components/home/recent-identifications";
import { DEMO_SCANS } from "@/lib/data/demo";
import { getSpecies } from "@/lib/data/species";
import { getMediaImage, getVerified, resolveStatus } from "@/lib/conservation";
import { StatusBadge } from "@/components/ui/status-badge";

const TRY_TIDE = ["green-sea-turtle", "blue-crab", "common-octopus"];

export default function HomePage() {
  const heroImage = getMediaImage("hero-reef")?.image ?? getVerified("green-sea-turtle")?.image ?? null;

  return (
    <PageTransition>
      <section className="relative">
        <div className="relative h-[52vh] max-h-[460px] min-h-[340px] w-full overflow-hidden">
          <SpeciesPhoto
            src={heroImage}
            alt="Coral reef teeming with marine life"
            emoji="🪸"
            className="absolute inset-0 h-full w-full"
            priority
            sizes="480px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.62)_0%,rgba(2,8,20,0.18)_38%,rgba(2,8,20,0.88)_82%,#020814_100%)]" />

          <header className="absolute inset-x-0 top-0 px-6 pt-[max(20px,env(safe-area-inset-top))]">
            <p className="text-[22px] leading-none font-semibold tracking-[0.36em] text-foam">TIDE</p>
            <p className="mt-2 text-[13px] text-mist">Marine intelligence in your hands.</p>
          </header>

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <h1 className="text-balance text-[34px] leading-[1.05] font-semibold tracking-tight text-foam">
              What did you find?
            </h1>
            <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-mist">
              Take a photo and discover what lives beneath the surface.
            </p>
          </div>
        </div>

        <div className="-mt-1 space-y-3 px-6">
          <ButtonLink href="/identify" size="lg" className="w-full">
            <Camera className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            Identify Marine Life
          </ButtonLink>
          <ButtonLink href="/identify?mode=upload" variant="secondary" size="md" className="w-full">
            <ImageUp className="h-4 w-4" strokeWidth={2} aria-hidden />
            Upload Photo
          </ButtonLink>
        </div>
      </section>

      <section className="mt-10 px-6">
        <SectionHeading
          eyebrow="Try TIDE"
          title="Start with an example"
          action={
            <Link
              href="/demo"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-turquoise hover:underline"
            >
              All demos
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />

        <div className="space-y-3">
          {TRY_TIDE.map((slug, index) => {
            const species = getSpecies(slug);
            const demo = DEMO_SCANS.find((scan) => scan.slug === slug);
            if (!species || !demo) return null;
            const status = resolveStatus(species);

            return (
              <Reveal key={slug} delay={index * 0.06}>
                <Link
                  href={`/identify?demo=${slug}`}
                  className="glass group flex items-center gap-4 rounded-[22px] p-3 transition-colors hover:border-turquoise/30"
                >
                  <SpeciesPhoto
                    src={getVerified(slug)?.image}
                    alt={species.commonName}
                    emoji={species.emoji}
                    className="h-16 w-16 shrink-0 rounded-2xl"
                    sizes="64px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foam">
                      {species.emoji} {species.commonName}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-mist">{demo.hook}</p>
                    <div className="mt-1.5">
                      <StatusBadge status={status} size="sm" />
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-turquoise"
                    aria-hidden
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <RecentIdentifications />

      <p className="mt-10 px-6 pb-4 text-center text-[13px] text-mist/70">
        Explore the ocean, one species at a time.
      </p>
    </PageTransition>
  );
}
