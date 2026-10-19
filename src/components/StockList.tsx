"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { Item } from "@/lib/types";
import { useNow } from "./useNow";

const DAY_MS = 86_400_000;

export function expiryStatus(expiry: string | null, now: Date): "expired" | "soon" | "ok" | "unknown" {
  if (!expiry) return "unknown";
  const days = (new Date(`${expiry}T23:59`).getTime() - now.getTime()) / DAY_MS;
  return days < 0 ? "expired" : days < 7 ? "soon" : "ok";
}

export function StockList({ items, onChanged }: { items: Item[] | null; onChanged: () => void }) {
  const now = useNow();
  const [error, setError] = useState<string | null>(null);

  async function setQuantity(id: number, quantity: number) {
    setError(null);
    try {
      await api(`/api/items/${id}`, { method: "PATCH", json: { quantity } });
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!items || !now) return <p className="text-muted">Loading stock…</p>;
  const groups = new Map<string, Item[]>();
  for (const item of items) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">In stock</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.length === 0 && <p className="card text-muted">Nothing in stock yet.</p>}
      {[...groups.entries()].map(([category, list]) => (
        <div key={category} className="card">
          <h3 className="mb-2 font-semibold">
            {category} <span className="font-normal text-muted">({list.reduce((n, i) => n + i.quantity, 0)})</span>
          </h3>
          <ul className="divide-y divide-border">
            {list.map((item) => {
              const status = expiryStatus(item.expiry, now);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="min-w-40 flex-1 font-medium">{item.name}</span>
                  {item.allergens.length > 0 && <span className="text-xs text-muted">Contains {item.allergens.join(", ")}</span>}
                  <span
                    className={`rounded px-1.5 text-xs ${
                      status === "expired" ? "bg-danger-soft text-danger" : status === "soon" ? "bg-warn-soft text-warn" : "text-muted"
                    }`}
                  >
                    {status === "unknown" ? "No date" : status === "expired" ? `Expired ${item.expiry}` : `BB ${item.expiry}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <button className="btn-quiet px-2 py-0.5" aria-label={`One fewer ${item.name}`} onClick={() => setQuantity(item.id, item.quantity - 1)}>
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                    <button className="btn-quiet px-2 py-0.5" aria-label={`One more ${item.name}`} onClick={() => setQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
