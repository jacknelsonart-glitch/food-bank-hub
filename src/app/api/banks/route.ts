import { connection } from "next/server";
import { z } from "zod";
import { createFoodBank, listFoodBanks } from "@/lib/db";
import { optionalText, parseBody } from "@/lib/http";

export async function GET() {
  await connection();
  return Response.json(listFoodBanks());
}

const NewBank = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: optionalText(50),
  website: z.url().nullish().transform((v) => v ?? null),
  notes: optionalText(),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, NewBank);
  if ("error" in parsed) return parsed.error;
  const id = createFoodBank(parsed.data);
  return Response.json({ id }, { status: 201 });
}
