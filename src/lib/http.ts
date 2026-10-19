import { z } from "zod";

export function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Parses a JSON body against a schema, returning either the data or a 400 response. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<{ data: z.infer<T> } | { error: Response }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { error: badRequest("Request body must be JSON.") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { error: badRequest(`${issue.path.join(".") || "body"}: ${issue.message}`) };
  }
  return { data: result.data };
}

export const optionalText = (max = 500) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "use HH:MM");
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");
