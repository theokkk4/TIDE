import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiIdentification } from "@/lib/types";

/**
 * The only file in TIDE that talks to an AI provider. Everything downstream consumes
 * the `AiIdentification` shape. Google Gemini is the primary provider (GEMINI_API_KEY);
 * Claude is kept as a fallback when only ANTHROPIC_API_KEY is configured.
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
  is_supported_animal: z
    .boolean()
    .describe(
      "True for fish, crabs, lobsters, shrimp and other shellfish, turtles (sea, freshwater or land), frogs, toads, salamanders, newts, and other aquatic or shoreline animals. False for anything else.",
    ),
  egg_mass_visible: z
    .enum(["yes", "no", "unknown"])
    .describe("Crabs and lobsters only: is an egg mass ('sponge') visible under the body? 'unknown' if the underside isn't visible or it isn't a crustacean."),
  crab_sex: z
    .enum(["male", "female", "unknown"])
    .describe("Crabs only, when the apron or claw tips show it (e.g. blue crab: narrow T-shaped apron = male; wide apron or red claw tips = female). Otherwise 'unknown'."),
});

const SYSTEM_PROMPT = `You identify animals from photographs for TIDE, an app that helps anglers and crabbers decide what to keep and what to release, and helps people who find a turtle or amphibian know what to do.

Rules:
- Report calibrated confidence. A clear, close photo of a distinctive species may justify 90+; a blurry or partial photo should be well below 70. Never report 100.
- When several species are plausible, say so in possible_alternatives rather than committing to one.
- Identify to species level only when visible features support it. Otherwise give the genus or the common group name and lower the confidence accordingly.
- Base visual_reasoning strictly on features visible in the image: shell scute pattern, fin shape and placement, colouration, body proportions, claw form, apron shape.
- Never estimate the animal's size or length: legal size limits are decided by the person measuring, not from a photo.
- Only report egg_mass_visible or crab_sex from what is actually visible. When unsure, say "unknown" — the person will be asked to check.
- Set is_supported_animal to false for mammals on land, birds, insects, people, food on a plate, or images with no animal in them. Cooked or plated seafood is not a live animal.`;

export type VisionFailure = "no_credentials" | "provider_error" | "unreadable";

export interface VisionResult {
  ok: boolean;
  identification: AiIdentification | null;
  failure?: VisionFailure;
  message?: string;
}

type MediaType = "image/jpeg" | "image/png" | "image/webp";

export function visionProvider(): "gemini" | "claude" | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

export function hasVisionCredentials() {
  return visionProvider() !== null;
}

export async function identifyMarineAnimal(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {
  const provider = visionProvider();
  if (provider === "gemini") return identifyWithGemini(imageBase64, mediaType);
  if (provider === "claude") return identifyWithClaude(imageBase64, mediaType);
  return {
    ok: false,
    identification: null,
    failure: "no_credentials",
    message: "AI identification is not configured on this deployment.",
  };
}

function finish(parsed: z.infer<typeof IdentificationSchema>): VisionResult {
  return {
    ok: true,
    identification: {
      ...parsed,
      confidence: Math.max(0, Math.min(99, Math.round(parsed.confidence))),
      possible_alternatives: parsed.possible_alternatives.slice(0, 3),
    },
  };
}

/* ─────────────  Google Gemini (primary)  ───────────── */

/** Gemini's structured-output schema: the same fields as IdentificationSchema. */
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    species_common_name: { type: "STRING" },
    scientific_name: { type: "STRING" },
    confidence: { type: "NUMBER" },
    animal_type: { type: "STRING" },
    visual_reasoning: { type: "STRING" },
    possible_alternatives: { type: "ARRAY", items: { type: "STRING" } },
    is_supported_animal: { type: "BOOLEAN" },
    egg_mass_visible: { type: "STRING", enum: ["yes", "no", "unknown"] },
    crab_sex: { type: "STRING", enum: ["male", "female", "unknown"] },
  },
  required: [
    "species_common_name",
    "scientific_name",
    "confidence",
    "animal_type",
    "visual_reasoning",
    "possible_alternatives",
    "is_supported_animal",
    "egg_mass_visible",
    "crab_sex",
  ],
  propertyOrdering: [
    "species_common_name",
    "scientific_name",
    "confidence",
    "animal_type",
    "visual_reasoning",
    "possible_alternatives",
    "is_supported_animal",
    "egg_mass_visible",
    "crab_sex",
  ],
};

const FIELD_GUIDE = Object.entries(IdentificationSchema.shape)
  .map(([key, field]) => `- ${key}: ${field.description ?? ""}`)
  .join("\n");

async function identifyWithGemini(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {
  // The "latest" alias tracks Google's current Flash model, which is fast enough for the
  // capture flow. Pin a specific model with GEMINI_MODEL if you need reproducibility.
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nFields:\n${FIELD_GUIDE}` }] },
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: mediaType, data: imageBase64 } },
                { text: "Identify the marine animal in this photograph." },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: GEMINI_SCHEMA,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403 || /API_KEY_INVALID|API key not valid/i.test(detail)) {
        return {
          ok: false,
          identification: null,
          failure: "no_credentials",
          message: "The configured Gemini API key was rejected.",
        };
      }
      if (response.status === 429) {
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
        message: `Gemini returned ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (data.promptFeedback?.blockReason || !text) {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't analyse this image.",
      };
    }

    const parsed = IdentificationSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return {
        ok: false,
        identification: null,
        failure: "unreadable",
        message: "We couldn't read a result from this image.",
      };
    }
    return finish(parsed.data);
  } catch (error) {
    return {
      ok: false,
      identification: null,
      failure: "provider_error",
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Identification timed out. Try again."
          : error instanceof Error
            ? error.message
            : "Identification failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* ─────────────  Claude (fallback)  ───────────── */

async function identifyWithClaude(imageBase64: string, mediaType: MediaType): Promise<VisionResult> {

  // Some keys aren't pinned to a single workspace and need the target workspace named
  // explicitly, or every request is rejected with a 400 before it reaches the model.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : undefined,
  );

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

    return finish(parsed);
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
