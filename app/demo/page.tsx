import Link from "next/link";
import { ArrowRight, Play, WifiOff } from "lucide-react";
import { DEMO_SCANS } from "@/lib/data/demo";
import { getSpecies } from "@/lib/data/species";
import { resolveStatus, speciesImage } from "@/lib/conservation";
import { getSeafoodVerdict } from "@/lib/seafood";
import { resolveStatusCode } from "@/lib/conservation";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageTransition, Reveal } from "@/components/ui/motion";

export const metadata = {
  title: "Demo Mode — TIDE",
};

export default function DemoPage() {
  return (
    <PageTransition>
      <header className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-turquoise/80 uppercase">Demo Mode</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight text-foam">
          See the whole experience
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-mist">
          Each example runs the full identification flow with a preloaded photo — the same screens a real capture
          produces.
        </p>
      </header>

      <div className="mt-5 px-6">
        <div className="flex items-center gap-2.5 rounded-2xl border border-foam/10 bg-foam/5 px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-turquoise" strokeWidth={1.9} aria-hidden />
          <p className="text-[12px] leading-relaxed text-mist">
            Works with no network, no camera permission and no API key.
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-3 px-6">
        {DEMO_SCANS.map((demo, index) => {
          const species = getSpecies(demo.slug);
          if (!species) return null;
          const status = resolveStatus(species);
          const verdict = getSeafoodVerdict(species, resolveStatusCode(species));

          return (
            <li key={demo.slug}>
              <Reveal delay={index * 0.05}>
                <Link href={`/identify?demo=${demo.slug}`} className="group block">
                  <div className="glass overflow-hidden rounded-[24px]">
                    <div className="relative h-40 w-full">
                      <SpeciesPhoto
                        src={speciesImage(species)}
                        alt={species.commonName}
                        emoji={species.emoji}
                        className="absolute inset-0 h-full w-full"
                        imageClassName="transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 480px) 100vw, 480px"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.15),rgba(2,8,20,0.9))]" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-[17px] font-semibold tracking-tight text-foam">
                            {species.emoji} {species.commonName}
                          </h2>
                          <p className="mt-0.5 truncate text-[12px] text-mist">{demo.hook}</p>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-turquoise text-abyss transition-transform group-hover:scale-105">
                          <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" aria-hidden />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                      <StatusBadge status={status} size="sm" />
                      <span className="inline-flex items-center gap-1 rounded-full border border-foam/12 bg-foam/5 px-2.5 py-1 text-[11px] text-mist">
                        <span aria-hidden>{verdict.indicator}</span>
                        {verdict.headline}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-turquoise">
                        Run demo
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 px-6 pb-2 text-center text-[12px] leading-relaxed text-mist/60">
        Demo scans are labelled as demo throughout the app. Conservation data shown is the same verified data used
        for real identifications.
      </p>
    </PageTransition>
  );
}
