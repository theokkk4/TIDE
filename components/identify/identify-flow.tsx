"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraView } from "@/components/identify/camera-view";
import { AnalyzingView, ANALYSIS_STAGES } from "@/components/identify/analyzing-view";
import { IdentifyError } from "@/components/identify/identify-error";
import { addRecentScan, setCurrentScan } from "@/lib/storage";
import type { IdentifyResponse, ScanRecord } from "@/lib/types";

type Phase = "capture" | "analyzing" | "error";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function IdentifyFlow({
  demoScan,
  autoOpenPicker = false,
}: {
  demoScan: ScanRecord | null;
  autoOpenPicker?: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(demoScan ? "analyzing" : "capture");
  const [photo, setPhoto] = useState<string | null>(demoScan?.photo ?? null);
  const [stage, setStage] = useState(0);
  const [failure, setFailure] = useState<{ reason: IdentifyResponse["error"]; message?: string }>({
    reason: "provider_error",
  });
  const startedRef = useRef(false);

  const finish = useCallback(
    (scan: ScanRecord, slug: string | null) => {
      setCurrentScan(scan);
      addRecentScan(scan);
      router.push(slug ? `/species/${slug}?scan=1` : "/species/unknown");
    },
    [router],
  );

  /** Demo Mode replays the staged experience locally — no camera, no network. */
  const runDemo = useCallback(
    async (scan: ScanRecord) => {
      for (let index = 0; index < ANALYSIS_STAGES.length; index++) {
        setStage(index);
        await sleep(340);
      }
      finish(scan, scan.slug);
    },
    [finish],
  );

  const runIdentification = useCallback(
    async (dataUrl: string) => {
      setPhoto(dataUrl);
      setPhase("analyzing");
      setStage(0);

      let result: IdentifyResponse;
      try {
        // Stage 1 advances while the same request is still in flight: the model is
        // reading the image, then naming what it sees.
        const request = fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const advance = sleep(900).then(() => setStage(1));
        const [response] = await Promise.all([request, advance]);
        result = (await response.json()) as IdentifyResponse;
      } catch {
        setFailure({ reason: "provider_error", message: "We couldn't reach the identification service." });
        setPhase("error");
        return;
      }

      if (!result.ok || !result.identification) {
        setFailure({ reason: result.error ?? "provider_error", message: result.message });
        setPhase("error");
        return;
      }

      const identification = result.identification;

      // Stage 2: verify the name against GBIF. Failure here is not fatal — the
      // curated dataset already carries a cached assessment.
      setStage(2);
      let liveStatus: string | null = null;
      try {
        const enrichResponse = await fetch(
          `/api/enrich?name=${encodeURIComponent(identification.scientific_name)}${
            result.matchedSlug ? `&slug=${result.matchedSlug}` : ""
          }`,
        );
        const enrichment = await enrichResponse.json();
        liveStatus = enrichment?.iucnCode ?? null;
      } catch {
        /* cached data covers this */
      }

      setStage(3);
      await sleep(260);
      setStage(4);

      const scan: ScanRecord = {
        id: `scan-${Date.now()}`,
        slug: result.matchedSlug,
        commonName: result.matched?.commonName ?? identification.species_common_name,
        scientificName: result.matched?.scientificName ?? identification.scientific_name,
        statusCode:
          result.matched?.statusCode ??
          ((liveStatus as ScanRecord["statusCode"]) ?? undefined),
        confidence: identification.confidence,
        photo: dataUrl,
        alternatives: identification.possible_alternatives,
        reasoning: identification.visual_reasoning,
        source: "ai",
        createdAt: Date.now(),
      };

      await sleep(200);
      finish(scan, result.matchedSlug);
    },
    [finish],
  );

  useEffect(() => {
    if (!demoScan || startedRef.current) return;
    startedRef.current = true;
    runDemo({ ...demoScan, createdAt: Date.now() });
  }, [demoScan, runDemo]);

  if (phase === "analyzing" && photo) {
    return <AnalyzingView photo={photo} stage={stage} />;
  }

  if (phase === "error") {
    return (
      <IdentifyError
        reason={failure.reason}
        message={failure.message}
        photo={photo}
        onRetry={() => {
          setPhoto(null);
          setPhase("capture");
        }}
      />
    );
  }

  return (
    <CameraView
      autoOpenPicker={autoOpenPicker}
      onCapture={runIdentification}
      onClose={() => router.push("/")}
    />
  );
}
