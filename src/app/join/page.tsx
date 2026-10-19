import type { Metadata } from "next";
import { JoinForm } from "@/components/JoinForm";

export const metadata: Metadata = { title: "Help out" };

export default function JoinPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Help out</h1>
        <p className="text-muted">Local businesses can sign up to donate surplus food. Volunteers can help sort donations or deliver supplies.</p>
      </div>
      <JoinForm />
    </div>
  );
}
