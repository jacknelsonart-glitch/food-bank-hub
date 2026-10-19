import type { Metadata } from "next";
import { Intake } from "@/components/Intake";

export const metadata: Metadata = { title: "Sort donations" };

export default function IntakePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sort donations</h1>
        <p className="text-muted">Scan or photograph each donated item. Check the suggestion, especially the date and allergens, then add it to stock.</p>
      </div>
      <Intake />
    </div>
  );
}
