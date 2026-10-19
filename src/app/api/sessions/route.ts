import { z } from "zod";
import { createSession } from "@/lib/db";
import { isoDate, optionalText, parseBody, time } from "@/lib/http";

const NewSession = z
  .object({
    foodBankId: z.number().int().positive(),
    dayOfWeek: z.number().int().min(0).max(6).nullish().transform((v) => v ?? null),
    date: isoDate.nullish().transform((v) => v ?? null),
    opens: time,
    closes: time,
    note: optionalText(200),
  })
  .refine((s) => (s.dayOfWeek == null) !== (s.date == null), "set either a weekday or a date")
  .refine((s) => s.opens < s.closes, "closing time must be after opening time");

export async function POST(request: Request) {
  const parsed = await parseBody(request, NewSession);
  if ("error" in parsed) return parsed.error;
  try {
    return Response.json({ id: createSession(parsed.data) }, { status: 201 });
  } catch {
    return Response.json({ error: "Food bank not found." }, { status: 404 });
  }
}
