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

    const updated = await prisma.virtualCard.update({
      where: { id },
      data: {
        ...(body.status !== undefined     && { status: body.status }),
        ...(body.label !== undefined      && { label: body.label }),
        ...(body.spendLimit !== undefined && { spendLimit: body.spendLimit }),
        ...(body.nfcEnabled !== undefined && { nfcEnabled: body.nfcEnabled }),
        ...("walletId" in body            && { walletId: body.walletId ?? null }),
      },
      include: { wallet: { select: { id: true, asset: true, network: true, balance: true } } },
    });

    return NextResponse.json({ card: serializeDecimals(updated) });
  } catch {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const card = await prisma.virtualCard.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!card || card.userId !== session.id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const hasRefund = card.balance.toNumber() > 0 && !!card.wallet;

    if (hasRefund && card.wallet) {
      await prisma.$transaction([
        prisma.virtualCard.update({ where: { id }, data: { status: "TERMINATED", balance: 0 } }),
        prisma.wallet.update({
          where: { id: card.wallet.id },
          data: { balance: { increment: card.balance } },
        }),
        prisma.transaction.create({
          data: {
            userId: session.id,
            walletId: card.wallet.id,
            cardId: id,
            type: "DEPOSIT",
            status: "COMPLETED",
            amount: card.balance,
            currency: card.wallet.asset,
            description: `Refund from deleted card: ${card.label ?? "Virtual Card"}`,
            reference: `REFUND-${id}-${Date.now()}`,
          },
        }),
      ]);
    } else {
      await prisma.virtualCard.update({ where: { id }, data: { status: "TERMINATED" } });
    }

    return NextResponse.json({
      ok: true,
      refunded: card.balance.toNumber() > 0 && !!card.wallet ? card.balance.toNumber() : 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
