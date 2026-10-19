import { describe, expect, it } from "vitest";
import { buildCalendar } from "@/lib/ics";

describe("calendar export", () => {
  it("writes weekly and one-off sessions", () => {
    const ics = buildCalendar(
      [{
        id: 1, name: "Test, Pantry", address: "1 Road", lat: 0, lng: 0, phone: null, website: null, notes: null, isDemo: false,
        sessions: [
          { id: 1, foodBankId: 1, dayOfWeek: 6, date: null, opens: "10:00", closes: "12:00", note: "Weekend food bank" },
          { id: 2, foodBankId: 1, dayOfWeek: null, date: "2026-12-24", opens: "09:30", closes: "11:00", note: null },
        ],
      }],
      new Date(2026, 9, 19, 9),
    );
    expect(ics).toContain("DTSTART:20261024T100000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=SA");
    expect(ics).toContain("DTSTART:20261224T093000");
    expect(ics).toContain("SUMMARY:Test\\, Pantry open");
    expect(ics.split("BEGIN:VEVENT")).toHaveLength(3);
  });
});
