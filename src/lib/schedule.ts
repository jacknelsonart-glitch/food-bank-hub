import type { Session } from "./types";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type Occurrence = {
  session: Session;
  /** Local date, YYYY-MM-DD. */
  date: string;
  start: Date;
  end: Date;
};

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

function startOfDay(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

/** All openings that start on a calendar day from `from` to `to`, inclusive, in local time. */
export function occurrencesBetween(sessions: Session[], from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = [];
  const last = startOfDay(to);
  for (let day = startOfDay(from); day <= last; day.setDate(day.getDate() + 1)) {
    const date = toDateString(day);
    for (const session of sessions) {
      const matches = session.date ? session.date === date : session.dayOfWeek === day.getDay();
      if (matches) {
        out.push({ session, date, start: atTime(day, session.opens), end: atTime(day, session.closes) });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function isOpenAt(sessions: Session[], now: Date): boolean {
  return occurrencesBetween(sessions, now, now).some((o) => o.start <= now && now < o.end);
}

/** The next opening that hasn't finished yet, looking up to five weeks ahead. */
export function nextOpening(sessions: Session[], now: Date): Occurrence | null {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 35);
  return occurrencesBetween(sessions, now, horizon).find((o) => o.end > now) ?? null;
}

/** Saturday and Sunday of the current weekend, or the next one on a weekday. */
export function upcomingWeekend(now: Date): { saturday: Date; sunday: Date } {
  const saturday = startOfDay(now);
  const dow = saturday.getDay();
  if (dow === 0) saturday.setDate(saturday.getDate() - 1);
  else saturday.setDate(saturday.getDate() + (6 - dow));
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  return { saturday, sunday };
}

export function weekendOpenings(sessions: Session[], now: Date): Occurrence[] {
  const { saturday, sunday } = upcomingWeekend(now);
  return occurrencesBetween(sessions, saturday, sunday).filter((o) => o.end > now);
}

export function describeSession(s: Session): string {
  const when = s.date ? formatDate(s.date) : `Every ${DAY_NAMES[s.dayOfWeek ?? 0]}`;
  return `${when}, ${s.opens}–${s.closes}${s.note ? ` (${s.note})` : ""}`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
