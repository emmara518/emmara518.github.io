import { db } from "@/db";
import { paymentChannels } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const channels = await db
      .select({
        id: paymentChannels.id,
        label: paymentChannels.label,
        account: paymentChannels.account,
        owner: paymentChannels.owner,
        hint: paymentChannels.hint,
      })
      .from(paymentChannels)
      .where(eq(paymentChannels.isActive, true))
      .orderBy(asc(paymentChannels.sortOrder));

    return new Response(JSON.stringify({ ok: true, data: channels }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "INTERNAL", message: "حدث خطأ غير متوقع" } }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}