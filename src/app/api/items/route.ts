import { connection } from "next/server";
import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { createItem, listItems } from "@/lib/db";
import { badRequest, isoDate, parseBody } from "@/lib/http";

export async function GET(request: Request) {
  await connection();
  const bank = Number(new URL(request.url).searchParams.get("bank"));
  if (!Number.isInteger(bank) || bank <= 0) return badRequest("Pass ?bank=<food bank id>.");
  return Response.json(listItems(bank));
}

const amount = z.number().min(0).max(100000).nullable();

const NewItem = z.object({
  foodBankId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(CATEGORIES),
  barcode: z.string().regex(/^\d{8,14}$/).nullable(),
  quantity: z.number().int().min(1).max(10000),
  unitWeightG: z.number().positive().max(100000).nullable(),
  expiry: isoDate.nullable(),
  allergens: z.array(z.string().trim().min(1).max(50)).max(20),
  nutrients: z.object({
    energyKcal: amount, proteinG: amount, fatG: amount, carbsG: amount, sugarsG: amount, fibreG: amount,
    saltG: amount, vitaminAUg: amount, vitaminCMg: amount, vitaminDUg: amount, calciumMg: amount, ironMg: amount,
  }),
  nutrientsEstimated: z.boolean(),
  source: z.enum(["barcode", "photo", "manual"]),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, NewItem);
  if ("error" in parsed) return parsed.error;
  try {
    return Response.json({ id: createItem(parsed.data) }, { status: 201 });
  } catch {
    return Response.json({ error: "Food bank not found." }, { status: 404 });
  }
}
