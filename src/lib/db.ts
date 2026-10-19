import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { FoodBank, FoodBankWithSessions, Item, ItemSource, Nutrients, Session, Signup, SignupStatus } from "./types";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS food_banks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT,
  website TEXT,
  notes TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  food_bank_id INTEGER NOT NULL REFERENCES food_banks(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  date TEXT,
  opens TEXT NOT NULL,
  closes TEXT NOT NULL,
  note TEXT,
  CHECK ((day_of_week IS NULL) <> (date IS NULL))
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY,
  food_bank_id INTEGER NOT NULL REFERENCES food_banks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit_weight_g REAL,
  expiry TEXT,
  allergens TEXT NOT NULL DEFAULT '[]',
  nutrients TEXT NOT NULL,
  nutrients_estimated INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('business', 'volunteer')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organisation TEXT,
  postcode TEXT,
  offer TEXT,
  availability TEXT,
  can_deliver INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "foodbank.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  if (process.env.SEED_DEMO !== "false") seedDemo(db);
  return db;
}

/** Fictional example food banks so a fresh install has something to show. */
function seedDemo(conn: DatabaseSync) {
  const { n } = conn.prepare("SELECT COUNT(*) AS n FROM food_banks").get() as unknown as { n: number };
  if (n > 0) return;
  const insertBank = conn.prepare(
    "INSERT INTO food_banks (name, address, lat, lng, phone, website, notes, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
  );
  const insertSession = conn.prepare(
    "INSERT INTO sessions (food_bank_id, day_of_week, date, opens, closes, note) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const demo: [string, string, number, number, string | null, [number, string, string, string | null][]][] = [
    ["Example Community Pantry", "1 Example Street (demo)", 53.4808, -2.2426, "Referral not needed", [
      [1, "10:00", "13:00", null],
      [3, "16:00", "19:00", "Evening session"],
      [6, "10:00", "12:00", "Weekend food bank"],
    ]],
    ["Example Church Food Bank", "22 Sample Road (demo)", 53.4705, -2.2301, "Bring proof of address if you have it", [
      [2, "11:00", "14:00", null],
      [5, "11:00", "14:00", null],
    ]],
    ["Example Weekend Larder", "Unit 3, Demo Business Park (demo)", 53.4932, -2.2195, null, [
      [6, "09:00", "13:00", "Weekend food bank"],
      [0, "12:00", "15:00", "Weekend food bank"],
    ]],
  ];
  conn.exec("BEGIN");
  try {
    for (const [name, address, lat, lng, notes, sessions] of demo) {
      const { lastInsertRowid } = insertBank.run(name, address, lat, lng, null, null, notes);
      for (const [day, opens, closes, note] of sessions) insertSession.run(lastInsertRowid, day, null, opens, closes, note);
    }
    conn.exec("COMMIT");
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

type BankRow = Omit<FoodBank, "isDemo"> & { is_demo: number };
type SessionRow = { id: number; food_bank_id: number; day_of_week: number | null; date: string | null; opens: string; closes: string; note: string | null };

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  foodBankId: r.food_bank_id,
  dayOfWeek: r.day_of_week,
  date: r.date,
  opens: r.opens,
  closes: r.closes,
  note: r.note,
});

export function listFoodBanks(): FoodBankWithSessions[] {
  const conn = getDb();
  const banks = conn.prepare("SELECT * FROM food_banks ORDER BY name").all() as unknown as BankRow[];
  const sessions = (conn.prepare("SELECT * FROM sessions ORDER BY day_of_week, date, opens").all() as unknown as SessionRow[]).map(toSession);
  return banks.map(({ is_demo, ...b }) => ({
    ...b,
    isDemo: is_demo === 1,
    sessions: sessions.filter((s) => s.foodBankId === b.id),
  }));
}

export function createFoodBank(input: Omit<FoodBank, "id" | "isDemo">): number {
  const { lastInsertRowid } = getDb()
    .prepare("INSERT INTO food_banks (name, address, lat, lng, phone, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(input.name, input.address, input.lat, input.lng, input.phone, input.website, input.notes);
  return Number(lastInsertRowid);
}

export function createSession(input: Omit<Session, "id">): number {
  const { lastInsertRowid } = getDb()
    .prepare("INSERT INTO sessions (food_bank_id, day_of_week, date, opens, closes, note) VALUES (?, ?, ?, ?, ?, ?)")
    .run(input.foodBankId, input.dayOfWeek, input.date, input.opens, input.closes, input.note);
  return Number(lastInsertRowid);
}

export function deleteSession(id: number): boolean {
  return getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id).changes > 0;
}

type ItemRow = {
  id: number;
  food_bank_id: number;
  name: string;
  category: string;
  barcode: string | null;
  quantity: number;
  unit_weight_g: number | null;
  expiry: string | null;
  allergens: string;
  nutrients: string;
  nutrients_estimated: number;
  source: ItemSource;
  created_at: string;
};

const toItem = (r: ItemRow): Item => ({
  id: r.id,
  foodBankId: r.food_bank_id,
  name: r.name,
  category: r.category,
  barcode: r.barcode,
  quantity: r.quantity,
  unitWeightG: r.unit_weight_g,
  expiry: r.expiry,
  allergens: JSON.parse(r.allergens) as string[],
  nutrients: JSON.parse(r.nutrients) as Nutrients,
  nutrientsEstimated: r.nutrients_estimated === 1,
  source: r.source,
  createdAt: r.created_at,
});

export function listItems(foodBankId: number): Item[] {
  return (
    getDb()
      .prepare("SELECT * FROM items WHERE food_bank_id = ? AND quantity > 0 ORDER BY category, expiry IS NULL, expiry, name")
      .all(foodBankId) as unknown as ItemRow[]
  ).map(toItem);
}

export function createItem(input: Omit<Item, "id" | "createdAt">): number {
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO items (food_bank_id, name, category, barcode, quantity, unit_weight_g, expiry, allergens, nutrients, nutrients_estimated, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.foodBankId,
      input.name,
      input.category,
      input.barcode,
      input.quantity,
      input.unitWeightG,
      input.expiry,
      JSON.stringify(input.allergens),
      JSON.stringify(input.nutrients),
      input.nutrientsEstimated ? 1 : 0,
      input.source,
    );
  return Number(lastInsertRowid);
}

export function setItemQuantity(id: number, quantity: number): boolean {
  return getDb().prepare("UPDATE items SET quantity = ? WHERE id = ?").run(quantity, id).changes > 0;
}

type SignupRow = Omit<Signup, "canDeliver" | "createdAt"> & { can_deliver: number; created_at: string };

export function listSignups(): Signup[] {
  return (getDb().prepare("SELECT * FROM signups ORDER BY status = 'pending' DESC, created_at DESC").all() as unknown as SignupRow[]).map(
    ({ can_deliver, created_at, ...s }) => ({ ...s, canDeliver: can_deliver === 1, createdAt: created_at }),
  );
}

export function createSignup(input: Omit<Signup, "id" | "status" | "createdAt">): number {
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO signups (kind, name, email, phone, organisation, postcode, offer, availability, can_deliver)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(input.kind, input.name, input.email, input.phone, input.organisation, input.postcode, input.offer, input.availability, input.canDeliver ? 1 : 0);
  return Number(lastInsertRowid);
}

export function setSignupStatus(id: number, status: SignupStatus): boolean {
  return getDb().prepare("UPDATE signups SET status = ? WHERE id = ?").run(status, id).changes > 0;
}

/** Takes `count` units out of stock. Fails without changing anything if there aren't enough left. */
export function takeFromItem(id: number, count: number): boolean {
  return getDb().prepare("UPDATE items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?").run(count, id, count).changes > 0;
}
