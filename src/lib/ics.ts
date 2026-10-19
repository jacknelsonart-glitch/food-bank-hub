import type { FoodBankWithSessions } from "./types";

const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function compactDate(date: string): string {
  return date.replace(/-/g, "");
}

function compactTime(hhmm: string): string {
  return hhmm.replace(":", "") + "00";
}

/** The first date on or after `from` that falls on `dayOfWeek`, as YYYYMMDD. */
function firstOnOrAfter(from: Date, dayOfWeek: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7));
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Builds an iCalendar feed of food bank openings. Times are "floating"
 * (no time zone), so calendar apps show them in the viewer's local time,
 * which matches how opening hours are written.
 */
export function buildCalendar(banks: FoodBankWithSessions[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Food Bank Hub//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Food bank openings"];

  for (const bank of banks) {
    for (const s of bank.sessions) {
      const day = s.date ? compactDate(s.date) : firstOnOrAfter(now, s.dayOfWeek ?? 0);
      lines.push(
        "BEGIN:VEVENT",
        `UID:session-${s.id}@food-bank-hub`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${day}T${compactTime(s.opens)}`,
        `DTEND:${day}T${compactTime(s.closes)}`,
        `SUMMARY:${escapeText(bank.name)} open`,
        `LOCATION:${escapeText(bank.address)}`,
      );
      if (s.dayOfWeek != null && !s.date) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[s.dayOfWeek]}`);
      if (s.note) lines.push(`DESCRIPTION:${escapeText(s.note)}`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
