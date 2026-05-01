import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fromWalletId, toWalletId, amount } = await req.json();

    if (!fromWalletId || !toWalletId || !amount || amount <= 0 || fromWalletId === toWalletId) {
      return NextResponse.json({ error: "Invalid transfer parameters" }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: fromWalletId } }),
      prisma.wallet.findUnique({ where: { id: toWalletId } }),
    ]);

    if (!from || from.userId !== session.id) {
      return NextResponse.json({ error: "Source wallet not found" }, { status: 404 });
    }
    if (!to || to.userId !== session.id) {
      return NextResponse.json({ error: "Destination wallet not found" }, { status: 404 });
    }
    if (from.balance.toNumber() < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const ref = `TRF-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
      await tx.wallet.update({ where: { id: toWalletId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({
        data: {
          userId: session.id,
          walletId: fromWalletId,
          type: "TRANSFER",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: from.asset,
          description: `Transfer ${from.asset} → ${to.asset}`,
          reference: `${ref}-OUT`,
        },
      });
      await tx.transaction.create({
        data: {
          userId: session.id,
          walletId: toWalletId,
          type: "TRANSFER",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: to.asset,
          description: `Transfer ${from.asset} → ${to.asset}`,
          reference: `${ref}-IN`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}
