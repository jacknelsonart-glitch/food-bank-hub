import { z } from "zod";
import { setSignupStatus } from "@/lib/db";
import { parseBody } from "@/lib/http";

const Update = z.object({ status: z.enum(["pending", "approved", "declined"]) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/signups/[id]">) {
  const { id } = await ctx.params;
  const parsed = await parseBody(request, Update);
  if ("error" in parsed) return parsed.error;
  if (!setSignupStatus(Number(id), parsed.data.status)) return Response.json({ error: "Sign-up not found." }, { status: 404 });
  return Response.json({ ok: true });
}
