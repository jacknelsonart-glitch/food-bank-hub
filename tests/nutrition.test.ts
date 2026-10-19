import { describe, expect, it } from "vitest";
import { analyseParcel, householdDailyNeeds, type ParcelLine } from "@/lib/nutrition";
import type { Nutrients } from "@/lib/types";

const empty: Nutrients = {
  energyKcal: null, proteinG: null, fatG: null, carbsG: null, sugarsG: null, fibreG: null,
  saltG: null, vitaminAUg: null, vitaminCMg: null, vitaminDUg: null, calciumMg: null, ironMg: null,
};

const pasta: ParcelLine = {
  name: "Pasta", quantity: 2, unitWeightG: 500,
  nutrients: { ...empty, energyKcal: 360, proteinG: 12, fatG: 1.5, carbsG: 72, sugarsG: 3, fibreG: 3, saltG: 0, ironMg: 1.3 },
};

describe("nutrition", () => {
  it("scales daily needs by household energy", () => {
    const needs = householdDailyNeeds({ adult: 2 }, "uk");
    expect(needs.energyKcal).toBe(4500);
    expect(needs.vitaminCMg).toBeCloseTo(180);
  });

  it("counts days of food from calories", () => {
    // 1 kg pasta = 3,600 kcal; one older adult needs 2,000 kcal a day.
    const report = analyseParcel([pasta], { olderAdult: 1 }, "uk");
    expect(report.days).toBeCloseTo(1.8);
  });

  it("flags nutrients that are short compared with the calories", () => {
    const report = analyseParcel([pasta], { adult: 1 }, "uk");
    expect(report.flags.some((f) => f.startsWith("Low in fat"))).toBe(true);
    expect(report.flags.some((f) => f.startsWith("Low in carbohydrate"))).toBe(false);
  });

  it("doesn't flag nutrients with no recorded data", () => {
    const report = analyseParcel([pasta], { adult: 1 }, "uk");
    expect(report.flags.some((f) => f.startsWith("Low in vitamin C"))).toBe(false);
    expect(report.nutrients.find((n) => n.key === "vitaminCMg")?.coverage).toBe(0);
  });

  it("flags a vitamin once enough items record it", () => {
    const withC = { ...pasta, nutrients: { ...pasta.nutrients, vitaminCMg: 0 } };
    const report = analyseParcel([withC], { adult: 1 }, "uk");
    expect(report.flags).toContain("Low in vitamin C: add fruit, fruit juice or tinned tomatoes.");
  });

  it("flags too much salt", () => {
    const soup: ParcelLine = { name: "Soup", quantity: 4, unitWeightG: 400, nutrients: { ...empty, energyKcal: 50, saltG: 0.8 } };
    const report = analyseParcel([soup], { adult: 1 }, "uk");
    expect(report.flags).toContain("High in salt for the number of days it covers.");
  });

  it("lists items without weight or calories instead of guessing", () => {
    const unknown: ParcelLine = { name: "Mystery tin", quantity: 1, unitWeightG: null, nutrients: empty };
    const report = analyseParcel([pasta, unknown], { adult: 1 }, "us");
    expect(report.missing).toEqual(["Mystery tin"]);
  });

  it("returns zero days for an empty household", () => {
    expect(analyseParcel([pasta], {}, "uk").days).toBe(0);
  });
});
