import { connection } from "next/server";
import { listFoodBanks } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";

export async function GET() {
  await connection();
  return new Response(buildCalendar(listFoodBanks(), new Date()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="food-bank-openings.ics"',
    },
  });
}
