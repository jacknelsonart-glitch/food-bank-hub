"use client";

import { useMemo, useState } from "react";
import { formatDate, occurrencesBetween, toDateString, type Occurrence } from "@/lib/schedule";
import type { FoodBankWithSessions } from "@/lib/types";
import { useBanks } from "./useBanks";
import { useNow } from "./useNow";

type Row = Occurrence & { bank: FoodBankWithSessions };

export function CalendarView() {
  const { banks, error } = useBanks();
  const now = useNow();
  const [weeks, setWeeks] = useState(2);
  const [weekendsOnly, setWeekendsOnly] = useState(false);

  const days = useMemo(() => {
    if (!banks || !now) return [];
    const end = new Date(now);
    end.setDate(end.getDate() + weeks * 7 - 1);
    const rows: Row[] = banks.flatMap((bank) => occurrencesBetween(bank.sessions, now, end).map((o) => ({ ...o, bank })));
    rows.sort((a, b) => a.start.getTime() - b.start.getTime());
    const byDay = new Map<string, Row[]>();
    for (let d = new Date(now); d <= end; d.setDate(d.getDate() + 1)) {
      if (weekendsOnly && d.getDay() !== 0 && d.getDay() !== 6) continue;
      byDay.set(toDateString(d), []);
    }
    for (const r of rows) byDay.get(r.date)?.push(r);
    return [...byDay.entries()];
  }, [banks, now, weeks, weekendsOnly]);

  if (error) return <p className="text-danger">Couldn&apos;t load the calendar: {error}</p>;
  if (!banks || !now) return <p className="text-muted">Loading calendar…</p>;

  const today = toDateString(now);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="chip" aria-pressed={!weekendsOnly} onClick={() => setWeekendsOnly(false)}>
          Every day
        </button>
        <button className="chip" aria-pressed={weekendsOnly} onClick={() => setWeekendsOnly(true)}>
          Weekends only
        </button>
        <a className="btn ml-auto text-sm" href="/api/calendar.ics">
          Add to my calendar
        </a>
      </div>
      <ol className="space-y-3">
        {days.map(([date, rows]) => {
          const d = new Date(`${date}T00:00`);
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <li key={date} className={`card ${weekend ? "border-accent" : ""}`}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold">
                {date === today ? "Today" : formatDate(date)}
                {weekend && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">Weekend</span>}
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-muted">No food banks open.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {rows.map((r) => (
                    <li key={`${r.session.id}-${date}`} className="flex flex-wrap gap-x-3 py-1.5 text-sm">
                      <span className="w-28 font-medium tabular-nums">
                        {r.session.opens}–{r.session.closes}
                      </span>
                      <span className="font-medium">{r.bank.name}</span>
                      <span className="text-muted">{r.session.note ?? r.bank.address}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <button className="btn-quiet w-full" onClick={() => setWeeks((w) => w + 2)}>
        Show two more weeks
      </button>
    </div>
  );
}
