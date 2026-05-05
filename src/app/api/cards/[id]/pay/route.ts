import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { amount, merchant, category, paymentMethod } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const card = await prisma.virtualCard.findUnique({
      where: { id },
      include: { fiatWallet: true },
    });
    if (!card || card.userId !== session.id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    if (card.status === "FROZEN") {
      return NextResponse.json({ error: "Card is frozen — unfreeze it before paying" }, { status: 400 });
    }
    if (card.status !== "ACTIVE") {
      return NextResponse.json({ error: "Card is not active" }, { status: 400 });
    }

    const spentAmount = card.spentAmount.toNumber();
    const spendLimit = card.spendLimit.toNumber();
    // spendLimit === 0 means unlimited
    if (spendLimit > 0 && spentAmount + amount > spendLimit) {
      const remaining = spendLimit - spentAmount;
      return NextResponse.json({ error: `Exceeds spend limit (remaining: $${remaining.toFixed(2)})` }, { status: 400 });
    }

    // Multi-currency card: pay directly from linked fiat wallet
    if (card.fiatWalletId && card.fiatWallet) {
      const walletBalance = card.fiatWallet.balance.toNumber();
      if (walletBalance < amount) {
        return NextResponse.json({ error: `Insufficient wallet balance (available: ${walletBalance.toFixed(2)} ${card.currency})` }, { status: 400 });
      }

      const updatedCard = await prisma.$transaction(async (tx) => {
        await tx.fiatWallet.update({
          where: { id: card.fiatWalletId! },
          data: { balance: { decrement: amount } },
        });
        const updated = await tx.virtualCard.update({
          where: { id },
          data: { spentAmount: { increment: amount } },
        });
        await tx.fiatTransaction.create({
          data: {
            userId: session.id,
            walletId: card.fiatWalletId!,
            type: "CARD_PAYMENT",
            amount,
            currency: card.currency,
            description: `${paymentMethod === "nfc" ? "NFC tap" : "Chip & PIN"} payment at ${merchant || "merchant"} via ${card.label ?? "card"}`,
            metadata: JSON.stringify({ paymentMethod: paymentMethod || "chip", cardId: id, merchant }),
          },
        });
        return updated;
      });

      return NextResponse.json({
        ok: true,
        balance: walletBalance - amount,
        spentAmount: updatedCard.spentAmount.toNumber(),
      });
    }

    // Digital currency card: pay from card balance
    const cardBalance = card.balance.toNumber();
    if (cardBalance < amount) {
      return NextResponse.json({ error: `Insufficient card balance (available: $${cardBalance.toFixed(2)})` }, { status: 400 });
    }

    const updatedCard = await prisma.$transaction(async (tx) => {
      const updated = await tx.virtualCard.update({
        where: { id },
        data: {
          balance: { decrement: amount },
          spentAmount: { increment: amount },
        },
      });
      await tx.transaction.create({
        data: {
          userId: session.id,
          cardId: id,
          type: "CARD_PAYMENT",
          status: "COMPLETED",
          amount,
          currency: card.currency,
          merchant: merchant || "Unknown Merchant",
          category: category || null,
          description: `${paymentMethod === "nfc" ? "NFC tap" : "Chip & PIN"} payment at ${merchant || "merchant"}`,
          metadata: JSON.stringify({ paymentMethod: paymentMethod || "chip" }),
        },
      });
      return updated;
    });

    return NextResponse.json({
      ok: true,
      balance: updatedCard.balance.toNumber(),
      spentAmount: updatedCard.spentAmount.toNumber(),
    });
  } catch {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
