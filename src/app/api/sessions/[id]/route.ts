import { deleteSession } from "@/lib/db";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const { id } = await ctx.params;
  if (!deleteSession(Number(id))) return Response.json({ error: "Session not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
