import { FindFood } from "@/components/FindFood";

export default function Home() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Find food near you</h1>
        <p className="text-muted">See which food banks are open now or this weekend. No account needed.</p>
      </div>
      <FindFood />
    </div>
  );
}
