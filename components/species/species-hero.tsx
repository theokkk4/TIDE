"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentScanFor, useSavedSpecies } from "@/lib/storage";
import { statusFromCode } from "@/lib/status";
import type { IucnCode } from "@/lib/types";

export function SpeciesHero({
  slug,
  commonName,
  scientificName,
  emoji,
  statusCode,
  stockPhoto,
  photoCredit,
}: {
  slug: string;
  commonName: string;
  scientificName: string;
  emoji: string;
  statusCode: IucnCode;
  stockPhoto: string | null;
  photoCredit: string | null;
}) {
  const router = useRouter();
  const scan = useCurrentScanFor(slug);
  const { toggle, isSaved } = useSavedSpecies();
  const saved = isSaved(slug);
  const photo = scan?.photo ?? stockPhoto;
  const isCapture = Boolean(scan?.photo && scan.source === "ai");

  return (
    <header className="relative">
      <div className="relative h-[46vh] max-h-[420px] min-h-[300px] w-full overflow-hidden">
        <SpeciesPhoto
          src={photo}
          alt={`${commonName} (${scientificName})`}
          emoji={emoji}
          className="absolute inset-0 h-full w-full"
          priority
          sizes="480px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.55)_0%,rgba(2,8,20,0.05)_32%,rgba(2,8,20,0.82)_78%,#020814_100%)]" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-abyss/55 backdrop-blur-md transition-colors hover:bg-abyss/75"
          >
            <ArrowLeft className="h-5 w-5 text-foam" strokeWidth={2} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() =>
              toggle({
                slug,
                commonName,
                scientificName,
                statusCode,
                // Prefer the bundled photo path: captured data URLs would eat the
                // localStorage quota after a handful of saves.
                photo: stockPhoto ?? scan?.photo ?? null,
              })
            }
            aria-pressed={saved}
            aria-label={saved ? `Remove ${commonName} from saved` : `Save ${commonName}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-abyss/55 backdrop-blur-md transition-colors hover:bg-abyss/75"
          >
            {saved ? (
              <BookmarkCheck className="h-5 w-5 text-turquoise" strokeWidth={2} aria-hidden />
            ) : (
              <Bookmark className="h-5 w-5 text-foam" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 px-6 pb-5"
        >
          {isCapture && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-abyss/60 px-2.5 py-1 text-[11px] font-medium text-turquoise backdrop-blur-md">
              <Sparkles className="h-3 w-3" aria-hidden />
              Your photo
            </span>
          )}
          <h1 className="text-balance text-[30px] leading-[1.08] font-semibold tracking-tight text-foam">
            <span aria-hidden>{emoji} </span>
            {commonName}
          </h1>
          <p className="mt-1 text-[14px] text-mist italic">{scientificName}</p>
          <div className="mt-3">
            <StatusBadge status={statusFromCode(statusCode)} />
          </div>
        </motion.div>
      </div>

      {photoCredit && !scan?.photo && (
        <p className="px-6 pt-2 text-[10px] leading-relaxed text-mist/40">Photo: {photoCredit}</p>
      )}
    </header>
  );
}
