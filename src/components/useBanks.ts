"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { FoodBankWithSessions } from "@/lib/types";

export function useBanks() {
  const [banks, setBanks] = useState<FoodBankWithSessions[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    api<FoodBankWithSessions[]>("/api/banks").then(setBanks, (e: Error) => setError(e.message));
  }, []);
  useEffect(reload, [reload]);
  return { banks, error, reload };
}
