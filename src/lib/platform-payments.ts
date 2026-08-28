/**
 * Platform payment channels — shown to students in the wallet section.
 * Fetches from database (admin-configurable).
 */

import { db } from "@/db";
import { paymentChannels } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type PaymentChannel = {
  id: string;
  label: string;
  account: string;
  owner: string;
  hint?: string;
};

let cachedChannels: { data: PaymentChannel[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getPaymentChannels(): Promise<PaymentChannel[]> {
  const now = Date.now();
  if (cachedChannels && now - cachedChannels.timestamp < CACHE_TTL) {
    return cachedChannels.data;
  }

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

  const formatted = channels.map(c => ({
    id: c.id,
    label: c.label,
    account: c.account,
    owner: c.owner,
    hint: c.hint ?? undefined,
  }));

  cachedChannels = { data: formatted, timestamp: Date.now() };
  return formatted;
}

/** Returns the list of valid active payment method IDs. */
export async function getValidPaymentMethodIds(): Promise<string[]> {
  const channels = await getPaymentChannels();
  return channels.map(c => c.id);
}

export const PAYMENT_METHOD_IDS = ["instapay", "vodafone_cash", "etisalat_cash", "orange_cash", "bank_transfer", "other"];

export function channelLabel(id: string): string {
  return id;
}