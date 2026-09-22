import type { IucnCode, SeafoodClass, Species } from "@/lib/types";
import { isThreatened } from "@/lib/status";

export interface SeafoodVerdict {
  key: SeafoodClass;
  headline: string;
  indicator: string;
  tone: "safe" | "watch" | "warn" | "alert" | "unknown";
  summary: string;
  /** Recipes are a reward for passing every check, never a default. */
  showRecipes: boolean;
  showAlternatives: boolean;
  /** Shown above recipes when sourcing is what makes the difference. */
  sourcingAdvisory?: string;
  /** Explains an automatic downgrade driven by live conservation data. */
  statusOverride?: string;
}

/**
 * Decides what TIDE is willing to say about eating a species.
 *
 * Two inputs, deliberately kept apart: the curated seafood classification (is this
 * species eaten, is it legal, is the fishery in trouble) and the live IUCN category.
 * A species that gets uplisted to Endangered loses its recipes automatically, even if
 * the curated data still calls it common seafood.
 */
export function getSeafoodVerdict(species: Species, statusCode: IucnCode): SeafoodVerdict {
  const threatened = isThreatened(statusCode);
  const severelyThreatened = statusCode === "EN" || statusCode === "CR" || statusCode === "EW" || statusCode === "EX";

  if (species.legallyProtected || species.seafoodClass === "PROTECTED") {
    return {
      key: "PROTECTED",
      headline: "Do Not Consume",
      indicator: "🔴",
      tone: "alert",
      summary: species.seafoodSummary,
      showRecipes: false,
      showAlternatives: true,
    };
  }

  if (species.seafoodClass === "NOT_COMMONLY_CONSUMED") {
    return {
      key: "NOT_COMMONLY_CONSUMED",
      headline: "Not Typically Eaten",
      indicator: "⚪",
      tone: "unknown",
      summary: species.seafoodSummary,
      showRecipes: false,
      showAlternatives: false,
    };
  }

  // Safety net: live data can move a species into a threatened category after the
  // curated dataset was written. Conservation status wins.
  if (severelyThreatened) {
    return {
      key: "SUSTAINABILITY_CONCERN",
      headline: "Check Local Guidance",
      indicator: "🟠",
      tone: "alert",
      summary: species.seafoodSummary,
      showRecipes: false,
      showAlternatives: true,
      statusOverride: `TIDE does not show recipes for species currently assessed as ${
        statusCode === "CR" ? "Critically Endangered" : "Endangered"
      }, even where a commercial fishery exists.`,
    };
  }

  if (species.seafoodClass === "SUSTAINABILITY_CONCERN") {
    const avoid = species.consumptionGuidance === "avoid";
    return {
      key: "SUSTAINABILITY_CONCERN",
      headline: "Check Local Guidance",
      indicator: "🟠",
      tone: "warn",
      summary: species.seafoodSummary,
      showRecipes: !avoid,
      showAlternatives: true,
      sourcingAdvisory: avoid
        ? undefined
        : "Global conservation status does not tell you whether this species is sustainable to catch in your region. Where it was caught, and how, decides that.",
      statusOverride: avoid
        ? "Sustainable seafood programmes currently advise against this species, so TIDE shows alternatives instead of recipes."
        : undefined,
    };
  }

  return {
    key: "COMMONLY_CONSUMED",
    headline: "Common Seafood",
    indicator: "🍽️",
    tone: "safe",
    summary: species.seafoodSummary,
    showRecipes: true,
    showAlternatives: false,
    sourcingAdvisory: threatened
      ? "This species is commonly eaten, but its global assessment is in a threatened category — sourcing matters more than usual."
      : undefined,
  };
}

export const SEAFOOD_LABELS: Record<SeafoodClass, string> = {
  PROTECTED: "Protected species",
  NOT_COMMONLY_CONSUMED: "Not a seafood species",
  COMMONLY_CONSUMED: "Commonly consumed",
  SUSTAINABILITY_CONCERN: "Sustainability concern",
};
