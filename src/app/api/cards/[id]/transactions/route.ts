import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 15;

  const card = await prisma.virtualCard.findUnique({
    where: { id },
    include: {
      wallet: { select: { id: true, asset: true, network: true } },
      fiatWallet: { select: { id: true, currency: true, name: true, balance: true } },
    },
  });
  if (!card || card.userId !== session.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (card.fiatWalletId) {
    // Fiat card — fetch from FiatTransaction for this wallet, filtered by card metadata
    const [txns, total] = await Promise.all([
      prisma.fiatTransaction.findMany({
        where: { userId: session.id, walletId: card.fiatWalletId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fiatTransaction.count({ where: { userId: session.id, walletId: card.fiatWalletId } }),
    ]);
    return NextResponse.json({
      card: serializeDecimals(card),
      transactions: serializeDecimals(txns),
      total,
      page,
      pages: Math.ceil(total / limit),
      source: "fiat",
    });
  }

  // Crypto card — fetch from Transaction where cardId matches
  const [txns, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.id, cardId: id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId: session.id, cardId: id } }),
  ]);

  return NextResponse.json({
    card: serializeDecimals(card),
    transactions: serializeDecimals(txns),
    total,
    page,
    pages: Math.ceil(total / limit),
    source: "crypto",
  });
}
