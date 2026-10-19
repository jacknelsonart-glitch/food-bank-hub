import type { Metadata } from "next";
import { StaffPanel } from "@/components/StaffPanel";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Staff</h1>
      <StaffPanel />
    </div>
  );
}
