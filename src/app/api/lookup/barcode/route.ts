import { connection } from "next/server";
import { badRequest } from "@/lib/http";
import { isValidBarcode, lookupBarcode } from "@/lib/openfoodfacts";

export async function GET(request: Request) {
  await connection();
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!isValidBarcode(code)) return badRequest("Barcodes are 8 to 14 digits.");
  try {
    const suggestion = await lookupBarcode(code);
    if (!suggestion) return Response.json({ error: "Not found in Open Food Facts. Try a photo or enter it by hand." }, { status: 404 });
    return Response.json(suggestion);
  } catch (err) {
    console.error("Barcode lookup failed", err);
    return Response.json({ error: "Couldn't reach Open Food Facts. Try again or enter it by hand." }, { status: 502 });
  }
}
