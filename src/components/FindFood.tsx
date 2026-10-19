"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { distanceKm, formatDistance } from "@/lib/geo";
import { describeSession, formatDate, isOpenAt, nextOpening, weekendOpenings, type Occurrence } from "@/lib/schedule";
import type { FoodBankWithSessions } from "@/lib/types";
import { useBanks } from "./useBanks";
import { useNow } from "./useNow";

const BankMap = dynamic(() => import("./BankMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-border sm:h-96" />,
});

type Filter = "all" | "open" | "weekend";

function when(o: Occurrence, now: Date): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day =
    o.start.toDateString() === now.toDateString() ? "Today" : o.start.toDateString() === tomorrow.toDateString() ? "Tomorrow" : formatDate(o.date);
  return `${day}, ${o.session.opens}–${o.session.closes}`;
}

export function FindFood() {
  const { banks, error } = useBanks();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("all");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const rows = useMemo(() => {
    if (!banks || !now) return [];
    return banks
      .map((bank) => ({
        bank,
        open: isOpenAt(bank.sessions, now),
        next: nextOpening(bank.sessions, now),
        weekend: weekendOpenings(bank.sessions, now),
        distance: me ? distanceKm(me, bank) : null,
      }))
      .filter((r) => (filter === "open" ? r.open : filter === "weekend" ? r.weekend.length > 0 : true))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0) || Number(b.open) - Number(a.open));
  }, [banks, now, filter, me]);

  const points = useMemo(
    () =>
      rows.map((r) => ({
        bank: r.bank,
        open: r.open,
        subtitle: r.open ? "Open now" : r.next && now ? `Next: ${when(r.next, now)}` : "No upcoming openings",
      })),
    [rows, now],
  );

  const locate = () => {
    if (!navigator.geolocation) return setLocError("Your browser can't share your location.");
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Couldn't get your location. You can still browse the map.");
        setLocating(false);
      },
      { timeout: 10_000 },
    );
  };

  if (error) return <p className="text-danger">Couldn&apos;t load food banks: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "open", "weekend"] as Filter[]).map((f) => (
          <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "open" ? "Open now" : "Open this weekend"}
          </button>
        ))}
        <button className="btn-quiet ml-auto text-sm" onClick={locate} disabled={locating}>
          {locating ? "Finding you…" : me ? "Update my location" : "Use my location"}
        </button>
      </div>
      {locError && <p className="text-sm text-warn">{locError}</p>}

      <BankMap
        points={points}
        me={me}
        onSelect={(id) => {
          setSelected(id);
          document.getElementById(`bank-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      {!banks || !now ? (
        <p className="text-muted">Loading food banks…</p>
      ) : rows.length === 0 ? (
        <p className="card text-muted">No food banks match this filter. Try &ldquo;All&rdquo;.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <BankCard key={r.bank.id} {...r} now={now} highlighted={selected === r.bank.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BankCard({
  bank,
  open,
  next,
  weekend,
  distance,
  now,
  highlighted,
}: {
  bank: FoodBankWithSessions;
  open: boolean;
  next: Occurrence | null;
  weekend: Occurrence[];
  distance: number | null;
  now: Date;
  highlighted: boolean;
}) {
  const directions = `https://www.openstreetmap.org/directions?to=${bank.lat}%2C${bank.lng}`;
  return (
    <li id={`bank-${bank.id}`} className={`card space-y-2 ${highlighted ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold">{bank.name}</h2>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${open ? "bg-accent-soft text-accent" : "bg-border text-muted"}`}>
          {open ? "Open now" : "Closed"}
        </span>
      </div>
      <p className="text-sm text-muted">
        {bank.address}
        {distance != null && ` · ${formatDistance(distance)} away`}
      </p>
      {bank.isDemo && <p className="text-xs text-warn">Example listing for demonstration</p>}
      {!open && next && <p className="text-sm">Next open: {when(next, now)}</p>}
      {weekend.length > 0 && <p className="text-sm font-medium text-accent">Open this weekend</p>}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">All opening times</summary>
        <ul className="mt-1 list-disc pl-5">
          {bank.sessions.map((s) => (
            <li key={s.id}>{describeSession(s)}</li>
          ))}
        </ul>
      </details>
      {bank.notes && <p className="text-sm">{bank.notes}</p>}
      <div className="flex flex-wrap gap-2 pt-1 text-sm">
        <a className="btn-quiet" href={directions} target="_blank" rel="noreferrer">
          Directions
        </a>
        {bank.phone && (
          <a className="btn-quiet" href={`tel:${bank.phone}`}>
            Call
          </a>
        )}
        {bank.website && (
          <a className="btn-quiet" href={bank.website} target="_blank" rel="noreferrer">
            Website
          </a>
        )}
      </div>
    </li>
  );
}
