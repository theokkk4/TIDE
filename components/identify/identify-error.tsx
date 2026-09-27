"use client";

import Link from "next/link";
import { CloudOff, Fish, KeyRound, Lightbulb, RotateCcw } from "lucide-react";
import { Button, ButtonLink, GlassCard } from "@/components/ui/primitives";
import type { IdentifyResponse } from "@/lib/types";

const TIPS = [
  "Move closer so the animal fills more of the frame",
  "Find better lighting, or turn the flash off underwater",
  "Get the whole animal in shot, including fins or claws",
];

const COPY: Record<NonNullable<IdentifyResponse["error"]>, { title: string; fallback: string }> = {
  no_credentials: {
    title: "Live identification is offline",
    fallback: "This deployment can't reach Gemini right now.",
  },
  provider_error: {
    title: "That didn't go through",
    fallback: "The identification service didn't answer. Your photo is fine — try again in a moment.",
  },
  unreadable: {
    title: "We couldn't identify this one",
    fallback: "The photo was hard to read. A clearer shot usually fixes it.",
  },
  not_supported: {
    title: "That's outside TIDE's field guide",
    fallback: "TIDE covers fish, crabs and other shellfish, turtles, frogs, toads and salamanders. Try a clear photo of one of those.",
  },
};

export function IdentifyError({
  reason,
  message,
  photo,
  onRetry,
  retryLabel = "Try another photo",
  onShowSaved,
}: {
  reason: IdentifyResponse["error"];
  message?: string;
  photo: string | null;
  onRetry: () => void;
  retryLabel?: string;
  /** Only for the Dive page's sample photos: replay the result recorded for that photo. */
  onShowSaved?: () => void;
}) {
  const kind = reason ?? "provider_error";
  const copy = COPY[kind];
  const Icon = kind === "no_credentials" ? KeyRound : kind === "provider_error" ? CloudOff : Fish;
  // A photo problem gets photo tips; a service problem doesn't.
  const photoProblem = kind === "unreadable";
  // "not_supported" is about what's in the photo, so the server's short line adds nothing.
  const body = kind === "not_supported" ? copy.fallback : (message ?? copy.fallback);

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-12">
      {photo && (
        <div className="mx-auto mb-7 h-32 w-32 overflow-hidden rounded-[26px] border border-foam/15 opacity-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foam/8">
          <Icon className="h-6 w-6 text-turquoise" strokeWidth={1.8} aria-hidden />
        </div>
      </div>

      <h1 className="mt-5 text-center text-[24px] font-semibold tracking-tight text-foam">{copy.title}</h1>

      <p className="mx-auto mt-3 max-w-[320px] text-center text-[14px] leading-relaxed text-mist" role="alert">
        {body}
        {kind === "no_credentials" && " Demo Mode shows the full experience without it."}
      </p>

      {photoProblem && (
        <GlassCard className="mx-auto mt-7 w-full max-w-[340px]">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-turquoise" strokeWidth={2} aria-hidden />
            <p className="text-[13px] font-semibold text-foam">Try this</p>
          </div>
          <ul className="space-y-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-[13px] leading-relaxed text-mist">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-turquoise" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="mx-auto mt-7 flex w-full max-w-[340px] flex-col gap-3">
        {kind !== "no_credentials" && (
          <Button onClick={onRetry} size="lg">
            <RotateCcw className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {retryLabel}
          </Button>
        )}
        {onShowSaved ? (
          <Button onClick={onShowSaved} variant={kind === "no_credentials" ? "primary" : "secondary"} size={kind === "no_credentials" ? "lg" : undefined}>
            Show the saved result for this photo
          </Button>
        ) : (
          <ButtonLink href="/demo" variant="secondary">
            Open Demo Mode
          </ButtonLink>
        )}
        <Link href="/" className="text-center text-[13px] text-mist hover:text-foam">
          Back to home
        </Link>
      </div>
    </div>
  );
}
