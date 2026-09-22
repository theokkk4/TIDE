import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders species photography with a graceful gradient fallback, so a missing or
 * un-synced image never shows a broken frame during a demo.
 */
export function SpeciesPhoto({
  src,
  alt,
  emoji,
  className,
  imageClassName,
  sizes = "(max-width: 480px) 100vw, 480px",
  priority = false,
  fill = true,
  width,
  height,
}: {
  src: string | null | undefined;
  alt: string;
  emoji?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[linear-gradient(145deg,#0a3358,#072044_55%,#0d5570)]",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="text-4xl opacity-70" aria-hidden>
          {emoji ?? "🌊"}
        </span>
      </div>
    );
  }

  // Captured photos arrive as data URLs, which the image optimizer cannot process.
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return (
      <div className={cn("overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn("h-full w-full object-cover", imageClassName)} />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        {...(fill ? { fill: true, sizes } : { width: width ?? 400, height: height ?? 300 })}
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
