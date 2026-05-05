import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

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

    const updated = await prisma.virtualCard.update({
      where: { id },
      data: {
        ...(body.status !== undefined      && { status: body.status }),
        ...(body.label !== undefined       && { label: body.label }),
        ...(body.spendLimit !== undefined  && { spendLimit: body.spendLimit }),
        ...(body.nfcEnabled !== undefined  && { nfcEnabled: body.nfcEnabled }),
        ...(body.oneTimeUse !== undefined  && { oneTimeUse: body.oneTimeUse }),
        ...("walletId" in body             && { walletId: body.walletId ?? null }),
        ...("freezeUntil" in body          && { freezeUntil: body.freezeUntil ? new Date(body.freezeUntil) : null }),
      },
      include: { wallet: { select: { id: true, asset: true, network: true, balance: true } } },
    });

    return NextResponse.json({ card: serializeDecimals(updated) });
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
              reference: `REFUND-${id}-${Date.now()}`,
            },
          });
        });
        return NextResponse.json({ ok: true, refunded: cardBalance });
      }
    }
    await prisma.virtualCard.update({ where: { id }, data: { status: "TERMINATED" } });
    return NextResponse.json({ ok: true, refunded: 0 });
  } catch (error) {
    console.error("[DELETE /api/cards/[id]]", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
