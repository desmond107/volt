import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { amount } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const card = await prisma.virtualCard.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!card || card.userId !== session.id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    if (!card.wallet) {
      return NextResponse.json({ error: "No wallet linked to this card" }, { status: 400 });
    }
    if (card.wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    const results = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: card.wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.virtualCard.update({
        where: { id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.id,
          walletId: card.wallet.id,
          cardId: id,
          type: "CARD_FUNDING",
          status: "COMPLETED",
          amount,
          currency: card.wallet.asset,
          description: `Funded ${card.label ?? "card"} from ${card.wallet.asset} wallet`,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      cardBalance: results[1].balance,
      walletBalance: results[0].balance,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fund card" }, { status: 500 });
  }
}
