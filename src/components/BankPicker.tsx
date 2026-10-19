"use client";

import { useEffect } from "react";
import { readLocal, writeLocal } from "@/lib/client";
import type { FoodBankWithSessions } from "@/lib/types";

const KEY = "food-bank-hub:bank";

/** Lets staff pick which food bank they're working at, remembered on this device. */
export function BankPicker({
  banks,
  value,
  onChange,
}: {
  banks: FoodBankWithSessions[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  useEffect(() => {
    if (value != null || banks.length === 0) return;
    const saved = Number(readLocal(KEY));
    onChange(banks.some((b) => b.id === saved) ? saved : banks[0].id);
  }, [banks, value, onChange]);

  return (
    <label className="block max-w-sm">
      <span className="label">Food bank</span>
      <select
        className="input"
        value={value ?? ""}
        onChange={(e) => {
          writeLocal(KEY, e.target.value);
          onChange(Number(e.target.value));
        }}
      >
        {banks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
