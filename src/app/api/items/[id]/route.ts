import { z } from "zod";
import { setItemQuantity, takeFromItem } from "@/lib/db";
import { parseBody } from "@/lib/http";

const Update = z.union([
  z.object({ quantity: z.number().int().min(0).max(10000) }),
  z.object({ take: z.number().int().min(1).max(10000) }),
]);

export async function PATCH(request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const parsed = await parseBody(request, Update);
  if ("error" in parsed) return parsed.error;
  if ("take" in parsed.data) {
    if (!takeFromItem(Number(id), parsed.data.take)) return Response.json({ error: "Not enough left in stock." }, { status: 409 });
  } else if (!setItemQuantity(Number(id), parsed.data.quantity)) {
    return Response.json({ error: "Item not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
