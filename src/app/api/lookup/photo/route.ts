import { badRequest } from "@/lib/http";
import { identifyFromPhoto, visionEnabled, type PhotoMediaType } from "@/lib/vision";

const TYPES: PhotoMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!visionEnabled()) {
    return Response.json({ error: "Photo sorting isn't set up on this site. Ask an admin to add an ANTHROPIC_API_KEY." }, { status: 503 });
  }
  let photo: FormDataEntryValue | null;
  try {
    photo = (await request.formData()).get("photo");
  } catch {
    return badRequest("Send the photo as form data in a field called 'photo'.");
  }
  if (!(photo instanceof File)) return badRequest("Send the photo as form data in a field called 'photo'.");
  if (!TYPES.includes(photo.type as PhotoMediaType)) return badRequest("Photos must be JPEG, PNG, WebP or GIF.");
  if (photo.size > MAX_BYTES) return badRequest("Photos must be under 5 MB.", 413);

  try {
    const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
    return Response.json(await identifyFromPhoto(data, photo.type as PhotoMediaType));
  } catch (err) {
    console.error("Photo lookup failed", err);
    const message = err instanceof Error && err.message.startsWith("The photo") ? err.message : "Couldn't identify the photo. Try again or enter it by hand.";
    return Response.json({ error: message }, { status: 502 });
  }
}
