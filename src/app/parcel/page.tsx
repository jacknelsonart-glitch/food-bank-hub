import type { Metadata } from "next";
import { ParcelBuilder } from "@/components/ParcelBuilder";

export const metadata: Metadata = { title: "Pack a parcel" };

export default function ParcelPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pack a parcel</h1>
        <p className="text-muted">Pick items from stock to see how many days of food the parcel gives this household, and which nutrients it&apos;s short of.</p>
      </div>
      <ParcelBuilder />
    </div>
  );
}
