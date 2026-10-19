import type { Metadata } from "next";
import { StaffLogin } from "@/components/StaffLogin";

export const metadata: Metadata = { title: "Staff sign in" };

export default function StaffLoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Staff sign in</h1>
        <p className="text-muted">Sorting donations, packing parcels and sign-ups are for food bank staff. This device will stay signed in for 30 days.</p>
      </div>
      <StaffLogin />
    </div>
  );
}
