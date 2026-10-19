import type { Metadata } from "next";
import { CalendarView } from "@/components/CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">When food banks are open</h1>
        <p className="text-muted">Every opening across all food banks, including weekend sessions. Add them to your phone&apos;s calendar so you don&apos;t miss one.</p>
      </div>
      <CalendarView />
    </div>
  );
}
