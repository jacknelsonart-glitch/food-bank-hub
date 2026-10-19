"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { EMPTY_NUTRIENTS } from "@/lib/nutrition";
import type { Item, ItemSuggestion } from "@/lib/types";
import { BankPicker } from "./BankPicker";
import { BarcodeScanner } from "./BarcodeScanner";
import { ItemForm, type ItemDraft } from "./ItemForm";
import { StockList } from "./StockList";
import { useBanks } from "./useBanks";

type Mode = "barcode" | "photo" | "manual";

const MANUAL: ItemDraft = {
  name: "",
  category: "Other",
  barcode: null,
  unitWeightG: null,
  allergens: [],
  nutrients: EMPTY_NUTRIENTS,
  nutrientsEstimated: false,
  source: "manual",
  notes: [],
  quantity: 1,
  expiry: null,
};

export function Intake() {
  const { banks, error: banksError } = useBanks();
  const [bankId, setBankId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("barcode");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [items, setItems] = useState<Item[] | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    if (bankId == null) return;
    api<Item[]>(`/api/items?bank=${bankId}`).then(setItems, (e: Error) => setError(e.message));
  }, [bankId]);
  useEffect(loadItems, [loadItems]);

  const startDraft = (d: ItemDraft) => {
    setDraft(d);
    setDraftKey((k) => k + 1);
    setSaved(null);
  };

  const lookupBarcode = useCallback(async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      const s = await api<ItemSuggestion>(`/api/lookup/barcode?code=${encodeURIComponent(code)}`);
      startDraft({ ...s, quantity: 1, expiry: null });
    } catch (e) {
      setError((e as Error).message);
      startDraft({ ...MANUAL, barcode: /^\d{8,14}$/.test(code) ? code : null });
    } finally {
      setBusy(false);
    }
  }, []);

  async function lookupPhoto(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("photo", await shrink(file));
      const s = await api<ItemSuggestion & { expiry: string | null }>("/api/lookup/photo", { method: "POST", body });
      startDraft({ ...s, quantity: 1 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(item: ItemDraft) {
    if (bankId == null) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/items", {
        method: "POST",
        json: {
          foodBankId: bankId,
          name: item.name,
          category: item.category,
          barcode: item.barcode,
          quantity: item.quantity,
          unitWeightG: item.unitWeightG,
          expiry: item.expiry,
          allergens: item.allergens,
          nutrients: item.nutrients,
          nutrientsEstimated: item.nutrientsEstimated,
          source: item.source,
        },
      });
      setSaved(`Added ${item.quantity} × ${item.name}.`);
      setDraft(null);
      loadItems();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (banksError) return <p className="text-danger">{banksError}</p>;
  if (!banks) return <p className="text-muted">Loading…</p>;
  if (banks.length === 0) return <p className="card">Add a food bank on the Staff page first.</p>;

  return (
    <div className="space-y-6">
      <BankPicker banks={banks} value={bankId} onChange={setBankId} />

      {draft ? (
        <ItemForm key={draftKey} initial={draft} onSave={save} onCancel={() => setDraft(null)} saving={busy} />
      ) : (
        <section className="card space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["barcode", "Scan barcode"],
                ["photo", "Take a photo"],
                ["manual", "Type it in"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button key={m} className="chip" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {label}
              </button>
            ))}
          </div>
          {mode === "barcode" && (
            <>
              <p className="text-sm text-muted">Best for packaged food. Details come from Open Food Facts, a free product database.</p>
              <BarcodeScanner onCode={lookupBarcode} busy={busy} />
            </>
          )}
          {mode === "photo" && (
            <>
              <p className="text-sm text-muted">For fresh food or items without a barcode. AI suggests what it is and you check it.</p>
              <label className="btn cursor-pointer">
                {busy ? "Looking at the photo…" : "Take or choose a photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) lookupPhoto(file);
                  }}
                />
              </label>
            </>
          )}
          {mode === "manual" && (
            <button className="btn" onClick={() => startDraft(MANUAL)}>
              Enter an item
            </button>
          )}
          {busy && mode === "barcode" && <p className="text-sm text-muted">Looking it up…</p>}
        </section>
      )}

      {error && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {saved && <p className="rounded-lg bg-accent-soft p-3 text-sm text-accent">{saved}</p>}

      <StockList items={items} onChanged={loadItems} />
    </div>
  );
}

/** Resizes large phone photos before upload so they stay well under the 5 MB limit. */
async function shrink(file: File, maxSide = 1600): Promise<Blob> {
  if (file.size < 1_500_000 || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
