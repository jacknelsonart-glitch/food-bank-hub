import { connection } from "next/server";
import { z } from "zod";
import { createSignup, listSignups } from "@/lib/db";
import { optionalText, parseBody } from "@/lib/http";

export async function GET() {
  await connection();
  return Response.json(listSignups());
}

const NewSignup = z.object({
  kind: z.enum(["business", "volunteer"]),
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  phone: optionalText(50),
  organisation: optionalText(200),
  postcode: optionalText(20),
  offer: optionalText(1000),
  availability: optionalText(500),
  canDeliver: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, NewSignup);
  if ("error" in parsed) return parsed.error;
  return Response.json({ id: createSignup(parsed.data) }, { status: 201 });
}
