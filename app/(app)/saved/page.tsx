"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, ChevronRight, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";
import { SpeciesPhoto } from "@/components/ui/species-photo";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageTransition } from "@/components/ui/motion";
import { useSavedSpecies } from "@/lib/storage";
import { statusFromCode } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default function SavedPage() {
  const { saved, remove } = useSavedSpecies();

  return (
    <PageTransition>
      <header className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-turquoise/80 uppercase">Saved</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight text-foam">
          Your species log
        </h1>
        <p className="mt-2 text-[13px] text-mist">
          {saved.length > 0
            ? `${saved.length} ${saved.length === 1 ? "species" : "species"} kept on this device.`
            : "Species you save are stored on this device only."}
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="mt-10 px-6">
          <div className="glass flex flex-col items-center gap-4 rounded-[26px] px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foam/8">
              <Bookmark className="h-6 w-6 text-mist" strokeWidth={1.7} aria-hidden />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-foam">Nothing saved yet</p>
              <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-mist">
                Tap the bookmark on any species to keep it here for later.
              </p>
            </div>
            <div className="mt-1 flex w-full flex-col gap-2.5">
              <ButtonLink href="/identify" className="w-full">
                Identify a species
              </ButtonLink>
              <ButtonLink href="/discover" variant="secondary" className="w-full">
                Browse Discover
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-7 space-y-3 px-6">
          <AnimatePresence initial={false}>
            {saved.map((entry) => (
              <motion.li
                key={entry.slug}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="glass flex items-center gap-3 rounded-[22px] p-3"
              >
                <Link href={`/species/${entry.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <SpeciesPhoto
                    src={entry.photo}
                    alt={entry.commonName}
                    className="h-16 w-16 shrink-0 rounded-2xl"
                    sizes="64px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foam">{entry.commonName}</p>
                    <p className="truncate text-[12px] text-mist/80 italic">{entry.scientificName}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={statusFromCode(entry.statusCode)} size="sm" />
                      <span className="text-[11px] text-mist/60">{formatDate(entry.savedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-mist" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(entry.slug)}
                  aria-label={`Remove ${entry.commonName} from saved`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist transition-colors hover:bg-status-alert/10 hover:text-status-alert"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </PageTransition>
  );
}
