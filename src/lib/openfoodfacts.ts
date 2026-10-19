import { categoriseFromHints } from "./categories";
import type { ItemSuggestion, Nutrients } from "./types";

const FIELDS = "product_name,brands,product_quantity,product_quantity_unit,categories_tags,allergens_tags,nutriments";

/** The subset of an Open Food Facts v2 product we read. */
export type OffProduct = {
  product_name?: string;
  brands?: string;
  product_quantity?: number | string;
  product_quantity_unit?: string;
  categories_tags?: string[];
  allergens_tags?: string[];
  nutriments?: Record<string, number | string | undefined>;
};

function num(value: number | string | undefined, scale = 1): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return n == null || Number.isNaN(n) ? null : n * scale;
}

function stripLang(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
}

/**
 * Converts an Open Food Facts product to a suggestion. OFF stores vitamins and
 * minerals per 100 g in grams, so they are scaled to mg or µg here.
 */
export function fromOffProduct(barcode: string, product: OffProduct): ItemSuggestion {
  const n = product.nutriments ?? {};
  const nutrients: Nutrients = {
    energyKcal: num(n["energy-kcal_100g"]),
    proteinG: num(n["proteins_100g"]),
    fatG: num(n["fat_100g"]),
    carbsG: num(n["carbohydrates_100g"]),
    sugarsG: num(n["sugars_100g"]),
    fibreG: num(n["fiber_100g"]),
    saltG: num(n["salt_100g"]),
    vitaminAUg: num(n["vitamin-a_100g"], 1e6),
    vitaminCMg: num(n["vitamin-c_100g"], 1e3),
    vitaminDUg: num(n["vitamin-d_100g"], 1e6),
    calciumMg: num(n["calcium_100g"], 1e3),
    ironMg: num(n["iron_100g"], 1e3),
  };

  const unit = (product.product_quantity_unit ?? "g").toLowerCase();
  const quantity = num(product.product_quantity);
  const unitWeightG = quantity == null ? null : unit === "kg" || unit === "l" ? quantity * 1000 : unit === "cl" ? quantity * 10 : quantity;

  const name = [product.brands?.split(",")[0]?.trim(), product.product_name?.trim()].filter(Boolean).join(" ") || `Product ${barcode}`;
  const notes: string[] = [];
  if (unitWeightG == null) notes.push("Pack size not found: enter the weight from the label.");
  if (nutrients.energyKcal == null) notes.push("No nutrition data in Open Food Facts for this product.");

  return {
    name,
    category: categoriseFromHints(product.categories_tags ?? []),
    barcode,
    unitWeightG,
    allergens: (product.allergens_tags ?? []).map(stripLang),
    nutrients,
    nutrientsEstimated: false,
    source: "barcode",
    notes,
  };
}

export function isValidBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code);
}

/** Looks up a barcode on Open Food Facts. Returns null when the product is unknown. */
export async function lookupBarcode(barcode: string): Promise<ItemSuggestion | null> {
  const base = process.env.OPEN_FOOD_FACTS_URL ?? "https://world.openfoodfacts.org";
  const res = await fetch(`${base}/api/v2/product/${barcode}.json?fields=${FIELDS}`, {
    // Open Food Facts asks apps to identify themselves.
    headers: { "User-Agent": process.env.OPEN_FOOD_FACTS_USER_AGENT ?? "FoodBankHub/0.1 (open source food bank app)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const body = (await res.json()) as { status?: number; product?: OffProduct };
  if (body.status !== 1 || !body.product) return null;
  return fromOffProduct(barcode, body.product);
}
