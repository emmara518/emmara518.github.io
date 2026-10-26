import { requireSuperAdmin } from "@/lib/permission-guard";
import { err } from "@/lib/http";
import { getPaymentRequestScreenshot } from "@/lib/services/payment-requests.service";
import { contentTypeForKey, createSignedDownloadUrl, isLegacyUploadKey, readLegacyUpload } from "@/lib/storage";
import { toEnvelope } from "@/lib/errors";

/** Serves a payment-proof screenshot to authenticated staff only. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const row = await getPaymentRequestScreenshot(id);
  if (!row) return err(404, "REQUEST_NOT_FOUND", "الطلب غير موجود");

  const key = row.screenshotKey;
  const mime = contentTypeForKey(key, "image/jpeg");

  try {
    if (isLegacyUploadKey(key)) {
      const buf = await readLegacyUpload(key);
      return new Response(new Uint8Array(buf), {
        headers: { "Content-Type": mime, "Cache-Control": "private, no-store" },
      });
    }

    const signedUrl = await createSignedDownloadUrl(key, { responseContentType: mime });
    return new Response(null, {
      status: 302,
      headers: { Location: signedUrl, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
