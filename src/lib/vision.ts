import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CATEGORIES } from "./categories";
import type { ItemSuggestion } from "./types";

const nullableNumber = z.number().nullable();

const PhotoResult = z.object({
  is_food_or_essential: z.boolean().describe("False if the photo shows nothing a food bank would stock."),
  name: z.string().describe("Short item name, including brand if visible, e.g. 'Heinz baked beans'."),
  category: z.enum(CATEGORIES),
  unit_weight_g: nullableNumber.describe("Weight or volume of one unit in g or ml, from the label if visible, otherwise a typical value."),
  unit_weight_from_label: z.boolean(),
  barcode: z.string().nullable().describe("Barcode digits only if clearly readable."),
  expiry: z.string().nullable().describe("Best-before or use-by date as YYYY-MM-DD, only if clearly readable."),
  allergens: z.array(z.string()).describe("Allergens printed on the pack, lower case, e.g. 'gluten', 'milk'. Empty if none visible."),
  nutrients_per_100g: z.object({
    energy_kcal: nullableNumber,
    protein_g: nullableNumber,
    fat_g: nullableNumber,
    carbs_g: nullableNumber,
    sugars_g: nullableNumber,
    fibre_g: nullableNumber,
    salt_g: nullableNumber,
    vitamin_a_ug: nullableNumber,
    vitamin_c_mg: nullableNumber,
    vitamin_d_ug: nullableNumber,
    calcium_mg: nullableNumber,
    iron_mg: nullableNumber,
  }),
  nutrients_from_label: z.boolean().describe("True only if the values were read from a visible nutrition label."),
  notes: z.array(z.string()).describe("Anything a volunteer should check, e.g. damaged packaging or an unreadable date."),
});

const SYSTEM = `You help volunteers at a food bank log donated items from a photo.
Identify the main item in the photo. If several identical items are shown, describe one unit.
Read the name, pack size, allergens, best-before date and nutrition from the label when visible.
When there is no label (for example fresh fruit), give typical nutrient values per 100 g for that food and set nutrients_from_label to false.
Never guess an expiry date or allergens that are not printed; use null or an empty list instead.
Add a note if the packaging looks damaged, opened, or unsafe to give out.`;

export function visionEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

export type PhotoMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Asks Claude to identify a donated item from a photo. A volunteer confirms the result before it is saved. */
export async function identifyFromPhoto(imageBase64: string, mediaType: PhotoMediaType): Promise<ItemSuggestion & { expiry: string | null }> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(PhotoResult) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: "Identify this donated item." },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("The photo could not be processed. Please enter the item by hand.");
  const r = response.parsed_output;
  if (!r) throw new Error("Could not read the item from the photo. Please try again or enter it by hand.");

  const notes = [...r.notes];
  if (!r.is_food_or_essential) notes.unshift("This doesn't look like something a food bank stocks.");
  if (!r.unit_weight_from_label && r.unit_weight_g != null) notes.push("Pack size is an estimate: check the label.");
  if (!r.nutrients_from_label) notes.push("Nutrition values are typical estimates, not from the label.");

  const n = r.nutrients_per_100g;
  return {
    name: r.name,
    category: r.category,
    barcode: r.barcode && /^\d{8,14}$/.test(r.barcode) ? r.barcode : null,
    unitWeightG: r.unit_weight_g,
    expiry: r.expiry && /^\d{4}-\d{2}-\d{2}$/.test(r.expiry) ? r.expiry : null,
    allergens: r.allergens,
    nutrients: {
      energyKcal: n.energy_kcal,
      proteinG: n.protein_g,
      fatG: n.fat_g,
      carbsG: n.carbs_g,
      sugarsG: n.sugars_g,
      fibreG: n.fibre_g,
      saltG: n.salt_g,
      vitaminAUg: n.vitamin_a_ug,
      vitaminCMg: n.vitamin_c_mg,
      vitaminDUg: n.vitamin_d_ug,
      calciumMg: n.calcium_mg,
      ironMg: n.iron_mg,
    },
    nutrientsEstimated: !r.nutrients_from_label,
    source: "photo",
    notes,
  };
}
