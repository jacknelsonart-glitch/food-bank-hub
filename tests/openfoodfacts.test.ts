import { describe, expect, it } from "vitest";
import { fromOffProduct, isValidBarcode } from "@/lib/openfoodfacts";

describe("Open Food Facts mapping", () => {
  it("converts units and picks a category", () => {
    const s = fromOffProduct("5000157024671", {
      product_name: "Baked Beans",
      brands: "Heinz, Kraft Heinz",
      product_quantity: "415",
      product_quantity_unit: "g",
      categories_tags: ["en:canned-foods", "en:baked-beans"],
      allergens_tags: [],
      nutriments: { "energy-kcal_100g": 78, "salt_100g": 0.6, "iron_100g": 0.0012, "vitamin-c_100g": 0.001 },
    });
    expect(s.name).toBe("Heinz Baked Beans");
    expect(s.category).toBe("Tinned & jarred");
    expect(s.unitWeightG).toBe(415);
    expect(s.nutrients.ironMg).toBeCloseTo(1.2);
    expect(s.nutrients.vitaminCMg).toBeCloseTo(1);
    expect(s.nutrients.proteinG).toBeNull();
    expect(s.notes).toEqual([]);
  });

  it("converts litres and notes missing data", () => {
    const s = fromOffProduct("12345678", { product_quantity: 1, product_quantity_unit: "L", allergens_tags: ["en:milk"] });
    expect(s.unitWeightG).toBe(1000);
    expect(s.allergens).toEqual(["milk"]);
    expect(s.notes).toContain("No nutrition data in Open Food Facts for this product.");
  });

  it("validates barcodes", () => {
    expect(isValidBarcode("5000157024671")).toBe(true);
    expect(isValidBarcode("12ab")).toBe(false);
  });
});
