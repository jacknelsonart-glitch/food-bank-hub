export type FoodBank = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  notes: string | null;
  isDemo: boolean;
};

/**
 * An opening session. Recurring sessions set `dayOfWeek` (0 = Sunday);
 * one-off sessions (pop-ups, holiday openings) set `date` instead.
 */
export type Session = {
  id: number;
  foodBankId: number;
  dayOfWeek: number | null;
  date: string | null;
  opens: string;
  closes: string;
  note: string | null;
};

export type FoodBankWithSessions = FoodBank & { sessions: Session[] };

/** Nutrient amounts per 100 g (or 100 ml) of a food. Missing values are null. */
export type Nutrients = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  sugarsG: number | null;
  fibreG: number | null;
  saltG: number | null;
  vitaminAUg: number | null;
  vitaminCMg: number | null;
  vitaminDUg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
};

export type ItemSource = "barcode" | "photo" | "manual";

/** A stock line in a food bank's inventory. */
export type Item = {
  id: number;
  foodBankId: number;
  name: string;
  category: string;
  barcode: string | null;
  quantity: number;
  /** Weight or volume of one unit, in grams or millilitres. */
  unitWeightG: number | null;
  expiry: string | null;
  allergens: string[];
  nutrients: Nutrients;
  /** True when nutrient values were estimated by AI rather than read from a label database. */
  nutrientsEstimated: boolean;
  source: ItemSource;
  createdAt: string;
};

/** What a lookup (barcode or photo) suggests, before a volunteer confirms it. */
export type ItemSuggestion = {
  name: string;
  category: string;
  barcode: string | null;
  unitWeightG: number | null;
  allergens: string[];
  nutrients: Nutrients;
  nutrientsEstimated: boolean;
  source: ItemSource;
  /** Anything the volunteer should double-check, e.g. an unreadable date. */
  notes: string[];
};

export type SignupKind = "business" | "volunteer";
export type SignupStatus = "pending" | "approved" | "declined";

export type Signup = {
  id: number;
  kind: SignupKind;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  postcode: string | null;
  offer: string | null;
  availability: string | null;
  canDeliver: boolean;
  status: SignupStatus;
  createdAt: string;
};
