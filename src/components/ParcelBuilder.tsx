"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, readLocal, writeLocal } from "@/lib/client";
import { analyseParcel, MEMBER_TYPES, MIN_COVERAGE, type Household, type Region } from "@/lib/nutrition";
import type { Item } from "@/lib/types";
import { BankPicker } from "./BankPicker";
import { expiryStatus } from "./StockList";
import { useBanks } from "./useBanks";
import { useNow } from "./useNow";

const REGION_KEY = "food-bank-hub:region";

function fmt(n: number): string {
  return n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(1);
}

export function ParcelBuilder() {
  const { banks, error: banksError } = useBanks();
  const now = useNow();
  const [bankId, setBankId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [region, setRegion] = useState<Region>(() => (readLocal(REGION_KEY) === "us" ? "us" : "uk"));
  const [household, setHousehold] = useState<Household>({ adult: 1 });
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packing, setPacking] = useState(false);

  const loadItems = useCallback(() => {
    if (bankId == null) return;
    api<Item[]>(`/api/items?bank=${bankId}`).then(setItems, (e: Error) => setError(e.message));
  }, [bankId]);
  useEffect(loadItems, [loadItems]);

  const chooseBank = useCallback((id: number) => {
    setPicked({});
    setBankId(id);
  }, []);

  const lines = useMemo(
    () => (items ?? []).filter((i) => picked[i.id]).map((i) => ({ ...i, quantity: picked[i.id] })),
    [items, picked],
  );
  const report = useMemo(() => analyseParcel(lines, household, region), [lines, household, region]);
  const people = Object.values(household).reduce((a, b) => a + (b ?? 0), 0);

  const pick = (item: Item, qty: number) => setPicked((p) => ({ ...p, [item.id]: Math.max(0, Math.min(item.quantity, qty)) }));

  async function pack() {
    setPacking(true);
    setError(null);
    try {
      for (const line of lines) {
        await api(`/api/items/${line.id}`, { method: "PATCH", json: { take: line.quantity } });
      }
      setStatus(`Parcel packed: ${lines.reduce((n, l) => n + l.quantity, 0)} items taken out of stock.`);
      setPicked({});
      loadItems();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPacking(false);
    }
  }

  if (banksError) return <p className="text-danger">{banksError}</p>;
  if (!banks || !now) return <p className="text-muted">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <BankPicker
          banks={banks}
          value={bankId}
          onChange={chooseBank}
        />

        <section className="card space-y-3">
          <h2 className="font-semibold">Who is the parcel for?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MEMBER_TYPES.map(({ type, label }) => (
              <label key={type} className="text-sm">
                <span className="label">{label}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={20}
                  value={household[type] ?? 0}
                  onChange={(e) => setHousehold((h) => ({ ...h, [type]: Math.max(0, Number(e.target.value)) }))}
                />
              </label>
            ))}
          </div>
          <label className="block max-w-xs text-sm">
            <span className="label">Nutrition guidelines</span>
            <select
              className="input"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value as Region);
                writeLocal(REGION_KEY, e.target.value);
              }}
            >
              <option value="uk">UK reference intakes</option>
              <option value="us">US Daily Values</option>
            </select>
          </label>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">Choose items</h2>
          {!items ? (
            <p className="text-muted">Loading stock…</p>
          ) : items.length === 0 ? (
            <p className="text-muted">Nothing in stock. Add donations on the Sort donations page.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const expired = expiryStatus(item.expiry, now) === "expired";
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                    <span className="min-w-40 flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="block text-xs text-muted">
                        {item.category} · {item.quantity} in stock
                        {item.unitWeightG ? ` · ${item.unitWeightG} g each` : ""}
                        {item.allergens.length > 0 ? ` · contains ${item.allergens.join(", ")}` : ""}
                      </span>
                    </span>
                    {expired ? (
                      <span className="rounded bg-danger-soft px-1.5 text-xs text-danger">Expired</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <button className="btn-quiet px-2 py-0.5" aria-label={`Remove one ${item.name}`} onClick={() => pick(item, (picked[item.id] ?? 0) - 1)}>
                          −
                        </button>
                        <span className="w-8 text-center tabular-nums">{picked[item.id] ?? 0}</span>
                        <button className="btn-quiet px-2 py-0.5" aria-label={`Add one ${item.name}`} onClick={() => pick(item, (picked[item.id] ?? 0) + 1)}>
                          +
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="card space-y-3" aria-live="polite">
          <h2 className="font-semibold">Nutrition check</h2>
          {people === 0 ? (
            <p className="text-sm text-muted">Add at least one person to the household.</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted">Choose items to see how long the parcel lasts.</p>
          ) : (
            <>
              <p>
                <span className="text-3xl font-bold">{report.days.toFixed(1)}</span> days of food
                <span className="block text-sm text-muted">
                  for {people} {people === 1 ? "person" : "people"}, based on calories
                </span>
              </p>
              {report.flags.length > 0 && (
                <ul className="space-y-1 rounded-lg bg-warn-soft p-3 text-sm text-warn">
                  {report.flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <ul className="space-y-1.5 text-sm">
                {report.nutrients.map((n) => {
                  const pct = report.days > 0 ? Math.min(100, (n.days / report.days) * 100) : 0;
                  const limit = n.key === "saltG" || n.key === "sugarsG";
                  return (
                    <li key={n.key}>
                      <div className="flex justify-between">
                        <span>{n.label}</span>
                        <span className="tabular-nums text-muted">
                          {n.coverage === 0 ? (
                            "no data"
                          ) : (
                            <>
                              {fmt(n.total)} {n.unit} · {n.days.toFixed(1)} days
                              {n.coverage < MIN_COVERAGE && " (partial data)"}
                            </>
                          )}
                        </span>
                      </div>
                      {n.key !== "energyKcal" && n.coverage > 0 && (
                        <div className="h-1.5 rounded bg-border">
                          <div className={`h-1.5 rounded ${limit ? "bg-warn" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {report.missing.length > 0 && (
                <p className="text-xs text-muted">Not counted (no size or calories recorded): {report.missing.join(", ")}.</p>
              )}
              {lines.some((l) => l.nutrientsEstimated) && <p className="text-xs text-muted">Some values are AI estimates.</p>}
              <p className="text-xs text-muted">A guide for packing balanced parcels, not medical or dietary advice.</p>
              <div className="flex gap-2">
                <button className="btn" onClick={pack} disabled={packing}>
                  {packing ? "Packing…" : "Pack and update stock"}
                </button>
                <button className="btn-quiet" onClick={() => window.print()}>
                  Print
                </button>
              </div>
            </>
          )}
          {status && <p className="text-sm text-accent">{status}</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
        </section>
      </aside>
    </div>
  );
}
