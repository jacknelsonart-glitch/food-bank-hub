import type { Nutrients } from "./types";

export type NutrientKey = keyof Nutrients;

export type NutrientInfo = {
  key: NutrientKey;
  label: string;
  unit: string;
  /** "limit" nutrients (salt, sugars) are flagged when there is too much, not too little. */
  kind: "target" | "limit";
  /** Suggestion shown when a parcel is short of this nutrient. */
  topUp?: string;
};

export const NUTRIENTS: NutrientInfo[] = [
  { key: "energyKcal", label: "Energy", unit: "kcal", kind: "target" },
  { key: "proteinG", label: "Protein", unit: "g", kind: "target", topUp: "tinned fish, beans, lentils, eggs or meat" },
  { key: "fatG", label: "Fat", unit: "g", kind: "target", topUp: "oil, nuts or tinned oily fish" },
  { key: "carbsG", label: "Carbohydrate", unit: "g", kind: "target", topUp: "pasta, rice, bread or cereal" },
  { key: "fibreG", label: "Fibre", unit: "g", kind: "target", topUp: "wholegrain cereal, oats, beans or vegetables" },
  { key: "vitaminAUg", label: "Vitamin A", unit: "µg", kind: "target", topUp: "carrots, sweet potato or leafy greens" },
  { key: "vitaminCMg", label: "Vitamin C", unit: "mg", kind: "target", topUp: "fruit, fruit juice or tinned tomatoes" },
  { key: "vitaminDUg", label: "Vitamin D", unit: "µg", kind: "target", topUp: "fortified cereal, oily fish or eggs" },
  { key: "calciumMg", label: "Calcium", unit: "mg", kind: "target", topUp: "UHT milk, cheese or fortified plant milk" },
  { key: "ironMg", label: "Iron", unit: "mg", kind: "target", topUp: "fortified cereal, beans, lentils or red meat" },
  { key: "sugarsG", label: "Sugars", unit: "g", kind: "limit" },
  { key: "saltG", label: "Salt", unit: "g", kind: "limit" },
];

export type Region = "uk" | "us";

/**
 * Daily reference amounts for an average adult on a 2,000 kcal diet.
 * UK: retained EU reference intakes (Regulation 1169/2011) plus the 30 g
 * fibre guideline. US: FDA Daily Values (2016 rule); salt is sodium × 2.5.
 */
export const REFERENCE_INTAKES: Record<Region, Record<NutrientKey, number>> = {
  uk: {
    energyKcal: 2000,
    proteinG: 50,
    fatG: 70,
    carbsG: 260,
    sugarsG: 90,
    fibreG: 30,
    saltG: 6,
    vitaminAUg: 800,
    vitaminCMg: 80,
    vitaminDUg: 10,
    calciumMg: 800,
    ironMg: 14,
  },
  us: {
    energyKcal: 2000,
    proteinG: 50,
    fatG: 78,
    carbsG: 275,
    sugarsG: 50,
    fibreG: 28,
    saltG: 5.75,
    vitaminAUg: 900,
    vitaminCMg: 90,
    vitaminDUg: 20,
    calciumMg: 1300,
    ironMg: 18,
  },
};

export type MemberType = "adult" | "olderAdult" | "teen" | "child" | "toddler";

export const MEMBER_TYPES: { type: MemberType; label: string; kcal: number }[] = [
  { type: "adult", label: "Adults (18–64)", kcal: 2250 },
  { type: "olderAdult", label: "Older adults (65+)", kcal: 2000 },
  { type: "teen", label: "Teenagers (11–17)", kcal: 2300 },
  { type: "child", label: "Children (4–10)", kcal: 1600 },
  { type: "toddler", label: "Toddlers (1–3)", kcal: 1100 },
];

export type Household = Partial<Record<MemberType, number>>;

/**
 * Daily needs for a household. Each member's needs are the 2,000 kcal
 * reference amounts scaled by their typical energy need. This is an
 * approximation for planning parcels, not individual dietary advice.
 */
export function householdDailyNeeds(household: Household, region: Region): Record<NutrientKey, number> {
  const ref = REFERENCE_INTAKES[region];
  let scale = 0;
  for (const { type, kcal } of MEMBER_TYPES) {
    scale += (household[type] ?? 0) * (kcal / ref.energyKcal);
  }
  const needs = {} as Record<NutrientKey, number>;
  for (const { key } of NUTRIENTS) needs[key] = ref[key] * scale;
  return needs;
}

export type ParcelLine = {
  name: string;
  quantity: number;
  unitWeightG: number | null;
  nutrients: Nutrients;
};

export type NutrientResult = {
  key: NutrientKey;
  label: string;
  unit: string;
  total: number;
  daily: number;
  days: number;
  /**
   * Share of the parcel's calories that come from items with a value recorded
   * for this nutrient (0–1). Low coverage means the total is an undercount.
   */
  coverage: number;
};

export type ParcelReport = {
  /** How many days of energy (calories) the parcel provides for the household. */
  days: number;
  nutrients: NutrientResult[];
  /** Plain-language findings, e.g. "Low in vitamin C: add fruit or tinned tomatoes". */
  flags: string[];
  /** Lines left out of the totals because their weight or energy is unknown. */
  missing: string[];
};

/** Below this share of the energy days, a nutrient is flagged as low. */
const LOW_RATIO = 0.6;
/** Above this share of the energy days, a limit nutrient is flagged as high. */
const HIGH_RATIO = 1.5;
/** Below this coverage, a nutrient's total is too incomplete to flag as low. */
export const MIN_COVERAGE = 0.8;

export function analyseParcel(lines: ParcelLine[], household: Household, region: Region): ParcelReport {
  const needs = householdDailyNeeds(household, region);
  const totals = {} as Record<NutrientKey, number>;
  const coveredKcal = {} as Record<NutrientKey, number>;
  for (const { key } of NUTRIENTS) {
    totals[key] = 0;
    coveredKcal[key] = 0;
  }

  const missing: string[] = [];
  for (const line of lines) {
    if (line.quantity <= 0) continue;
    if (!line.unitWeightG || line.nutrients.energyKcal == null) {
      missing.push(line.name);
      continue;
    }
    const factor = (line.quantity * line.unitWeightG) / 100;
    const kcal = line.nutrients.energyKcal * factor;
    for (const { key } of NUTRIENTS) {
      const value = line.nutrients[key];
      if (value == null) continue;
      totals[key] += value * factor;
      coveredKcal[key] += kcal;
    }
  }

  const nutrients = NUTRIENTS.map(({ key, label, unit }) => ({
    key,
    label,
    unit,
    total: totals[key],
    daily: needs[key],
    days: needs[key] > 0 ? totals[key] / needs[key] : 0,
    coverage: totals.energyKcal > 0 ? coveredKcal[key] / totals.energyKcal : 0,
  }));

  const days = nutrients.find((n) => n.key === "energyKcal")!.days;
  const flags: string[] = [];
  if (days > 0) {
    for (const info of NUTRIENTS) {
      if (info.key === "energyKcal") continue;
      const result = nutrients.find((n) => n.key === info.key)!;
      const name = info.label.charAt(0).toLowerCase() + info.label.slice(1);
      if (info.kind === "target" && result.coverage >= MIN_COVERAGE && result.days < days * LOW_RATIO) {
        flags.push(`Low in ${name}: add ${info.topUp}.`);
      }
      if (info.kind === "limit" && result.days > days * HIGH_RATIO) {
        flags.push(`High in ${name} for the number of days it covers.`);
      }
    }
  }

  return { days, nutrients, flags, missing };
}

export const EMPTY_NUTRIENTS: Nutrients = {
  energyKcal: null,
  proteinG: null,
  fatG: null,
  carbsG: null,
  sugarsG: null,
  fibreG: null,
  saltG: null,
  vitaminAUg: null,
  vitaminCMg: null,
  vitaminDUg: null,
  calciumMg: null,
  ironMg: null,
};
