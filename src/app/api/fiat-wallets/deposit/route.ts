import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { walletId, amount } = await req.json();
  if (!walletId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const wallet = await prisma.fiatWallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== session.id) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.fiatWallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId,
        type: "DEPOSIT",
        amount,
        currency: wallet.currency,
        description: `Deposited ${amount.toLocaleString()} ${wallet.currency}`,
        reference: `DEP-${Date.now()}`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
