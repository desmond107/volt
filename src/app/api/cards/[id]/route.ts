import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals, genRef } from "@/lib/utils";
import { decryptCard } from "@/lib/card-crypto";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const card = await prisma.virtualCard.findUnique({ where: { id } });
    if (!card || card.userId !== session.id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (body.walletId) {
      const wallet = await prisma.wallet.findUnique({ where: { id: body.walletId } });
      if (!wallet || wallet.userId !== session.id) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
    }

    // Auto-unfreeze: if freezeUntil has passed, clear it and set status to ACTIVE
    if (card.status === "FROZEN" && card.freezeUntil && new Date() >= card.freezeUntil) {
      await prisma.virtualCard.update({ where: { id }, data: { status: "ACTIVE", freezeUntil: null } });
    }

    const ALLOWED_STATUSES = new Set(["ACTIVE", "FROZEN"]);
    if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Cap freeze duration at 90 days to prevent indefinite freezes
    let resolvedFreezeUntil: Date | null | undefined = undefined;
    if ("freezeUntil" in body) {
      if (!body.freezeUntil) {
        resolvedFreezeUntil = null;
      } else {
        const requested = new Date(body.freezeUntil);
        const maxFreeze = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        resolvedFreezeUntil = requested > maxFreeze ? maxFreeze : requested;
      }
    }

    const updated = await prisma.virtualCard.update({
      where: { id },
      data: {
        ...(body.status !== undefined      && { status: body.status }),
        ...(body.label !== undefined       && { label: body.label }),
        ...(body.spendLimit !== undefined  && (() => {
          const v = Number(body.spendLimit);
          return Number.isFinite(v) && v >= 0 ? { spendLimit: Math.min(v, 100_000) } : {};
        })()),
        ...(body.nfcEnabled !== undefined  && { nfcEnabled: body.nfcEnabled }),
        ...(body.oneTimeUse !== undefined  && { oneTimeUse: body.oneTimeUse }),
        ...("walletId" in body             && { walletId: body.walletId ?? null }),
        ...(resolvedFreezeUntil !== undefined && { freezeUntil: resolvedFreezeUntil }),
      },
      include: { wallet: { select: { id: true, asset: true, network: true, balance: true } } },
    });

    return NextResponse.json({ card: decryptCard(serializeDecimals(updated)) });
  } catch {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const card = await prisma.virtualCard.findUnique({ where: { id } });
    if (!card || card.userId !== session.id) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    const cardBalance = card.balance.toNumber();
    if (cardBalance > 0 && card.walletId) {
      const wallet = await prisma.wallet.findUnique({ where: { id: card.walletId } });
      if (wallet) {
        await prisma.$transaction(async (tx) => {
          await tx.virtualCard.update({ where: { id }, data: { status: "TERMINATED", balance: 0 } });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: cardBalance } } });
          await tx.transaction.create({
            data: {
              userId: session.id,
              walletId: wallet.id,
              cardId: id,
              type: "DEPOSIT",
              status: "COMPLETED",
              amount: cardBalance,
              currency: wallet.asset,
              description: `Refund from deleted card: ${card.label ?? "Virtual Card"}`,
              reference: genRef("REFUND"),
            },
          });
        });
        return NextResponse.json({ ok: true, refunded: cardBalance });
      }
    }
    await prisma.virtualCard.update({ where: { id }, data: { status: "TERMINATED" } });
    return NextResponse.json({ ok: true, refunded: 0 });
  } catch {
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
