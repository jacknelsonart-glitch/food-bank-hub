import { describe, expect, it } from "vitest";
import { isOpenAt, nextOpening, occurrencesBetween, upcomingWeekend, weekendOpenings } from "@/lib/schedule";
import type { Session } from "@/lib/types";

const session = (over: Partial<Session>): Session => ({
  id: 1, foodBankId: 1, dayOfWeek: null, date: null, opens: "10:00", closes: "12:00", note: null, ...over,
});

// 2026-10-19 is a Monday.
const monday = (h: number, m = 0) => new Date(2026, 9, 19, h, m);

describe("schedule", () => {
  it("knows when a weekly session is open", () => {
    const s = [session({ dayOfWeek: 1 })];
    expect(isOpenAt(s, monday(11))).toBe(true);
    expect(isOpenAt(s, monday(12))).toBe(false);
    expect(isOpenAt(s, monday(9, 59))).toBe(false);
  });

  it("finds the next opening, skipping one that has finished", () => {
    const s = [session({ id: 1, dayOfWeek: 1 }), session({ id: 2, dayOfWeek: 3, opens: "16:00", closes: "19:00" })];
    expect(nextOpening(s, monday(11))?.session.id).toBe(1);
    const next = nextOpening(s, monday(13));
    expect(next?.session.id).toBe(2);
    expect(next?.date).toBe("2026-10-21");
  });

  it("includes one-off dated sessions", () => {
    const s = [session({ date: "2026-10-24", opens: "09:00", closes: "11:00" })];
    const found = occurrencesBetween(s, monday(0), new Date(2026, 9, 31));
    expect(found.map((o) => o.date)).toEqual(["2026-10-24"]);
  });

  it("works out the upcoming weekend from a weekday and from a Sunday", () => {
    expect(upcomingWeekend(monday(9)).saturday.getDate()).toBe(24);
    const sunday = new Date(2026, 9, 25, 10);
    const w = upcomingWeekend(sunday);
    expect(w.saturday.getDate()).toBe(24);
    expect(w.sunday.getDate()).toBe(25);
  });

  it("lists only weekend openings that haven't ended", () => {
    const s = [session({ id: 1, dayOfWeek: 6 }), session({ id: 2, dayOfWeek: 0 }), session({ id: 3, dayOfWeek: 2 })];
    expect(weekendOpenings(s, monday(9)).map((o) => o.session.id)).toEqual([1, 2]);
    expect(weekendOpenings(s, new Date(2026, 9, 25, 13)).map((o) => o.session.id)).toEqual([]);
  });
});
