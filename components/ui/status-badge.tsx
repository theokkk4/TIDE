import { AlertTriangle, CircleAlert, CircleHelp, ShieldCheck, TriangleAlert } from "lucide-react";
import { TONE_CLASSES, type StatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

const TONE_ICONS = {
  safe: ShieldCheck,
  watch: CircleAlert,
  warn: TriangleAlert,
  alert: AlertTriangle,
  unknown: CircleHelp,
} as const;

/**
 * Status is always carried by an icon, the category code and the written label —
 * never by colour alone.
 */
export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: StatusMeta;
  size?: "sm" | "md";
  className?: string;
}) {
  const tone = TONE_CLASSES[status.tone];
  const Icon = TONE_ICONS[status.tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold",
        tone.bg,
        tone.border,
        tone.text,
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-[13px]",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.2} aria-hidden />
      <span>{status.label}</span>
      <span className={cn("font-mono text-[10px] opacity-70", size === "sm" && "hidden")}>{status.code}</span>
    </span>
  );
}
