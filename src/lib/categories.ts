export const CATEGORIES = [
  "Tinned & jarred",
  "Dry goods",
  "Fresh fruit & veg",
  "Dairy & eggs",
  "Meat & fish",
  "Bread & bakery",
  "Baby food & formula",
  "Drinks",
  "Snacks & treats",
  "Toiletries & household",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

// Checked in order, so more specific categories come first.
const KEYWORDS: [Category, string[]][] = [
  ["Baby food & formula", ["baby", "infant", "formula"]],
  ["Toiletries & household", ["toilet", "soap", "shampoo", "toothpaste", "nappies", "diaper", "detergent", "sanitary", "cleaning"]],
  ["Drinks", ["beverage", "drink", "juice", "water", "tea", "coffee", "soda"]],
  ["Tinned & jarred", ["canned", "tinned", "jar", "preserve", "soup", "baked-beans"]],
  ["Dairy & eggs", ["dairies", "dairy", "milk", "cheese", "yogurt", "yoghurt", "egg", "butter"]],
  ["Meat & fish", ["meat", "fish", "chicken", "beef", "pork", "seafood", "tuna", "sausage"]],
  ["Bread & bakery", ["bread", "bakery", "baguette", "rolls", "croissant"]],
  ["Snacks & treats", ["snack", "biscuit", "cookie", "chocolate", "sweet", "candy", "crisps", "chips", "confectioner"]],
  ["Fresh fruit & veg", ["fruit", "vegetable", "produce", "apple", "banana", "potato", "carrot", "onion"]],
  ["Dry goods", ["pasta", "rice", "cereal", "grain", "flour", "noodle", "lentil", "legume", "oat", "breakfast"]],
];

/** Maps free-text category hints (e.g. Open Food Facts tags) onto our categories. */
export function categoriseFromHints(hints: string[]): Category {
  const text = hints.join(" ").toLowerCase();
  for (const [category, words] of KEYWORDS) {
    if (words.some((w) => text.includes(w))) return category;
  }
  return "Other";
}
