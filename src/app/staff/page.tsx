import type { Metadata } from "next";
import { StaffSignOut } from "@/components/StaffLogin";
import { StaffPanel } from "@/components/StaffPanel";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Staff</h1>
        <StaffSignOut />
      </div>
      <StaffPanel />
    </div>
  );
}
