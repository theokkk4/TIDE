"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Images, X, RefreshCw, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/primitives";

type CameraState = "starting" | "live" | "blocked" | "unavailable";

/** Keeps uploads small enough to post quickly on venue wifi. */
const MAX_EDGE = 1280;

async function fileToScaledDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return drawToDataUrl(bitmap, bitmap.width, bitmap.height);
}

type CameraOutcome =
  | { ok: true; stream: MediaStream }
  | { ok: false; state: Exclude<CameraState, "starting" | "live">; notice: string };

/** Acquisition is kept free of React state so the caller owns every transition. */
async function acquireCamera(): Promise<CameraOutcome> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      state: "unavailable",
      notice: "This browser can't open a camera here. Upload a photo instead.",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
      audio: false,
    });
    return { ok: true, stream };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return name === "NotAllowedError" || name === "SecurityError"
      ? {
          ok: false,
          state: "blocked",
          notice: "Camera access is blocked. You can still upload a photo from your device.",
        }
      : {
          ok: false,
          state: "unavailable",
          notice: "No camera available on this device. Upload a photo instead.",
        };
  }
}

function drawToDataUrl(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function CameraView({
  onCapture,
  onClose,
  autoOpenPicker = false,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  autoOpenPicker?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Upload mode skips the camera entirely, so start in the state it will end up in.
  const [state, setState] = useState<CameraState>(autoOpenPicker ? "unavailable" : "starting");
  const [notice, setNotice] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    const outcome = await acquireCamera();

    if (!outcome.ok) {
      setState(outcome.state);
      setNotice(outcome.notice);
      return;
    }

    streamRef.current = outcome.stream;
    if (videoRef.current) {
      videoRef.current.srcObject = outcome.stream;
      await videoRef.current.play().catch(() => undefined);
    }
    setState("live");
    setNotice(null);
  }, []);

  useEffect(() => {
    if (autoOpenPicker) {
      fileInputRef.current?.click();
      return;
    }
    // startCamera's setState calls all happen after an internal `await`, in a later
    // task — never synchronously inside this effect — so this isn't the cascading
    // render pattern the rule guards against; it's the standard "acquire an external
    // resource on mount" effect. The lint rule can't see across the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startCamera();
    return stopStream;
  }, [autoOpenPicker, startCamera, stopStream]);

  useEffect(() => stopStream, [stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const dataUrl = drawToDataUrl(video, video.videoWidth, video.videoHeight);
    stopStream();
    onCapture(dataUrl);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      stopStream();
      onCapture(dataUrl);
    } catch {
      setNotice("We couldn't read that image. Try a different photo.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-abyss">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            state === "live" ? "opacity-100" : "opacity-0"
          }`}
        />

        {state !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foam/8">
              {state === "starting" ? (
                <RefreshCw className="h-7 w-7 animate-spin text-turquoise" strokeWidth={1.8} aria-hidden />
              ) : (
                <CameraOff className="h-7 w-7 text-mist" strokeWidth={1.8} aria-hidden />
              )}
            </div>
            <p className="max-w-[280px] text-[15px] leading-relaxed text-mist">
              {state === "starting" ? "Opening camera…" : (notice ?? "Camera unavailable.")}
            </p>
            {state !== "starting" && (
              <div className="flex w-full max-w-[260px] flex-col gap-2.5">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Images className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Upload a photo
                </Button>
                {state === "blocked" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setState("starting");
                      startCamera();
                    }}
                  >
                    Try camera again
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Framing guides, only meaningful when a live preview is showing */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            state === "live" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(2,8,20,0.72)_100%)]" />
          <div className="absolute inset-x-8 top-1/2 aspect-square -translate-y-1/2 rounded-[40px] border border-foam/25" />
          <div className="absolute inset-x-8 top-1/2 aspect-square -translate-y-1/2">
            {[
              "left-0 top-0 border-l-2 border-t-2 rounded-tl-[40px]",
              "right-0 top-0 border-r-2 border-t-2 rounded-tr-[40px]",
              "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-[40px]",
              "right-0 bottom-0 border-r-2 border-b-2 rounded-br-[40px]",
            ].map((corner) => (
              <span key={corner} className={`absolute h-10 w-10 border-turquoise ${corner}`} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="absolute top-[max(16px,env(safe-area-inset-top))] right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-abyss/60 backdrop-blur-md"
        >
          <X className="h-5 w-5 text-foam" aria-hidden />
        </button>

        {state === "live" && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-abyss/60 px-4 py-2 text-[13px] text-foam/90 backdrop-blur-md"
          >
            Point your camera at a marine animal
          </motion.p>
        )}
      </div>

      <div
        className={`relative z-20 flex items-center justify-between px-10 pt-6 pb-[max(28px,env(safe-area-inset-bottom))] ${
          state === "blocked" || state === "unavailable" ? "hidden" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Choose a photo from your gallery"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-foam/15 bg-foam/6 transition-colors hover:border-turquoise/40"
        >
          <Images className="h-5 w-5 text-foam" strokeWidth={1.9} aria-hidden />
        </button>

        <button
          type="button"
          onClick={capture}
          disabled={state !== "live"}
          aria-label="Take photo"
          className="group flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-foam/80 transition-transform active:scale-95 disabled:opacity-40"
        >
          <span className="h-16 w-16 rounded-full bg-foam transition-colors group-active:bg-turquoise" />
        </button>

        <div className="h-12 w-12" aria-hidden />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="sr-only"
        aria-label="Upload a photo of a marine animal"
      />
    </div>
  );
}
