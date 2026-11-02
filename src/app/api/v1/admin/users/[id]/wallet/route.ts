import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { users, walletAccounts, walletTransactions, auditLogs, notifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ServiceError, toEnvelope } from "@/lib/errors";

const adjustWalletSchema = z.object({
  amountEgp: z.number().min(-50000).max(50000),
  reason: z.string().trim().max(200).default("Manual wallet adjustment"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, adjustWalletSchema);
  if ("response" in parsed) return parsed.response;
  const { id: userId } = await params;

  try {
    const amountCents = Math.round(parsed.data.amountEgp * 100);
    if (amountCents === 0) {
      throw new ServiceError(422, "INVALID_AMOUNT", "Adjustment amount cannot be zero");
    }

    const result = await db.transaction(async (tx) => {
      const userRows = await tx.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
      if (!userRows[0]) throw new ServiceError(404, "USER_NOT_FOUND", "Student not found");

      await tx.insert(walletAccounts).values({ userId, balanceCents: 0 }).onConflictDoNothing();
      const walletRows = await tx
        .select({ id: walletAccounts.id, balanceCents: walletAccounts.balanceCents })
        .from(walletAccounts)
        .where(eq(walletAccounts.userId, userId))
        .limit(1);
      const wallet = walletRows[0];
      if (!wallet) throw new ServiceError(500, "WALLET_UNAVAILABLE", "Wallet could not be initialized");

      await tx.execute(sql`SELECT id FROM wallet_accounts WHERE id = ${wallet.id} FOR UPDATE`);
      if (amountCents < 0 && wallet.balanceCents + amountCents < 0) {
        throw new ServiceError(422, "INSUFFICIENT_BALANCE", "Adjustment would make the wallet negative");
      }

      const [updated] = await tx
        .update(walletAccounts)
        .set({ balanceCents: sql`${walletAccounts.balanceCents} + ${amountCents}` })
        .where(eq(walletAccounts.id, wallet.id))
        .returning({ balanceCents: walletAccounts.balanceCents });

      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        amountCents,
        kind: amountCents >= 0 ? "grant" : "purchase",
        note: parsed.data.reason,
      });

      await tx.insert(notifications).values({
        userId,
        title: amountCents >= 0 ? "Wallet credited" : "Wallet debited",
        body: `Wallet ${amountCents >= 0 ? "credited" : "debited"} by ${Math.abs(parsed.data.amountEgp)} EGP${parsed.data.reason ? ` (${parsed.data.reason})` : ""}. Balance: ${updated.balanceCents} EGP cents.`,
        kind: "payment",
      });

      await tx.insert(auditLogs).values({
        actorId: auth.user.id,
        action: "wallet.adjust",
        entity: "wallet_accounts",
        entityId: userId,
        meta: { amountEgp: parsed.data.amountEgp, newBalanceCents: updated.balanceCents, reason: parsed.data.reason },
      });

      return { balanceCents: updated.balanceCents };
    });

    return ok({ success: true, ...result });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
