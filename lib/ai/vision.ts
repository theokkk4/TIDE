import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiIdentification } from "@/lib/types";

/**
 * The only file in TIDE that talks to an AI provider. Everything downstream consumes
 * the `AiIdentification` shape, so swapping providers means rewriting this file alone.
 */

const IdentificationSchema = z.object({
  species_common_name: z
    .string()
    .describe("Most likely common name, e.g. 'Green Sea Turtle'. Empty string if unidentifiable."),
  scientific_name: z.string().describe("Binomial name, e.g. 'Chelonia mydas'. Empty string if unsure."),
  confidence: z.number().describe("Calibrated confidence from 0 to 100 that the identification is correct."),
  animal_type: z
    .string()
    .describe("Broad group: turtle, fish, shark, ray, crustacean, cephalopod, marine mammal, other."),
  visual_reasoning: z
    .string()
    .describe("One or two sentences naming the visible features that drove the identification."),
  possible_alternatives: z
    .array(z.string())
    .describe("Up to three other species the photo could plausibly show, most likely first."),
  is_marine_animal: z.boolean().describe("False if the photo does not show a marine animal at all."),
});

const SYSTEM_PROMPT = `You identify marine animals from photographs for TIDE, a marine conservation app.

Rules:
- Report calibrated confidence. A clear, close photo of a distinctive species may justify 90+; a blurry or partial photo should be well below 70. Never report 100.
- When several species are plausible, say so in possible_alternatives rather than committing to one.
- Identify to species level only when visible features support it. Otherwise give the genus or the common group name and lower the confidence accordingly.
- Base visual_reasoning strictly on features visible in the image: shell scute pattern, fin shape and placement, colouration, body proportions, claw form.
- Set is_marine_animal to false for land animals, freshwater-only species, people, food on a plate, or images with no animal in them.
- Cooked or plated seafood is not a live marine animal: set is_marine_animal to false.`;

export type VisionFailure = "no_credentials" | "provider_error" | "unreadable";

export interface VisionResult {
  ok: boolean;
  identification: AiIdentification | null;
  failure?: VisionFailure;
  message?: string;
}

export function hasVisionCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function identifyMarineAnimal(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<VisionResult> {
  if (!hasVisionCredentials()) {
    return {
      ok: false,
      identification: null,
      failure: "no_credentials",
      message: "AI identification is not configured on this deployment.",
    };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: process.env.TIDE_VISION_MODEL ?? "claude-opus-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(IdentificationSchema),
        // Species identification from a single photo does not need deep reasoning,
        // and the capture flow is latency-sensitive.
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            {
              type: "text",
              text: "Identify the marine animal in this photograph.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't analyse this image.",
      };
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't read a result from this image.",
      };
    }

    return {
      ok: true,
      identification: {
        ...parsed,
        confidence: Math.max(0, Math.min(99, Math.round(parsed.confidence))),
        possible_alternatives: parsed.possible_alternatives.slice(0, 3),
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        ok: false,
        identification: null,
        failure: "no_credentials",
        message: "The configured AI credentials were rejected.",
      };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        identification: null,
        failure: "provider_error",
        message: "Identification is busy right now. Try again in a moment.",
      };
    }
    return {
      ok: false,
      identification: null,
      failure: "provider_error",
      message: error instanceof Error ? error.message : "Identification failed.",
    };
  }
}
