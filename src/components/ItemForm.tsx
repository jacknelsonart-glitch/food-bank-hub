"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { NUTRIENTS } from "@/lib/nutrition";
import type { ItemSuggestion, Nutrients } from "@/lib/types";

export type ItemDraft = ItemSuggestion & { quantity: number; expiry: string | null };

/** The volunteer's check of a suggested item before it goes into stock. */
export function ItemForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ItemDraft;
  onSave: (item: ItemDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [item, setItem] = useState(initial);
  const [allergens, setAllergens] = useState(initial.allergens.join(", "));
  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => setItem((i) => ({ ...i, [key]: value }));
  const setNutrient = (key: keyof Nutrients, raw: string) =>
    setItem((i) => ({ ...i, nutrients: { ...i.nutrients, [key]: raw === "" ? null : Number(raw) } }));

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...item, allergens: allergens.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) });
      }}
    >
      <h2 className="text-lg font-semibold">Check and add to stock</h2>
      {item.notes.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-warn-soft p-3 text-sm text-warn">
          {item.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">Item</span>
          <input className="input" value={item.name} onChange={(e) => set("name", e.target.value)} required maxLength={200} />
        </label>
        <label>
          <span className="label">Category</span>
          <select className="input" value={item.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">How many</span>
          <input
            className="input"
            type="number"
            min={1}
            max={10000}
            value={item.quantity}
            onChange={(e) => set("quantity", Math.max(1, Number(e.target.value)))}
            required
          />
        </label>
        <label>
          <span className="label">Size of one (g or ml)</span>
          <input
            className="input"
            type="number"
            min={1}
            step="any"
            value={item.unitWeightG ?? ""}
            onChange={(e) => set("unitWeightG", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label>
          <span className="label">Best before / use by</span>
          <input className="input" type="date" value={item.expiry ?? ""} onChange={(e) => set("expiry", e.target.value || null)} />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Allergens (check the label)</span>
          <input className="input" value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="e.g. gluten, milk, soya" />
        </label>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Nutrition per 100 g {item.nutrientsEstimated && <span className="text-warn">(estimated)</span>}
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {NUTRIENTS.map((n) => (
            <label key={n.key} className="text-sm">
              <span className="label">
                {n.label} ({n.unit})
              </span>
              <input
                className="input"
                type="number"
                min={0}
                step="any"
                value={item.nutrients[n.key] ?? ""}
                onChange={(e) => setNutrient(n.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>
      <div className="flex gap-2">
        <button className="btn" disabled={saving}>
          {saving ? "Adding…" : "Add to stock"}
        </button>
        <button type="button" className="btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
