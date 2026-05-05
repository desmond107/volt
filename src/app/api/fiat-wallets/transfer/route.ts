import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRates, convertAmount } from "@/lib/rates";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromWalletId, toWalletId, amount } = await req.json();
  if (!fromWalletId || !toWalletId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const [from, to] = await Promise.all([
    prisma.fiatWallet.findUnique({ where: { id: fromWalletId } }),
    prisma.fiatWallet.findUnique({ where: { id: toWalletId } }),
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

  const rates = await getRates();
  const receivedAmount = convertAmount(amount, from.currency, to.currency, rates);
  const ref = `TRF-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.fiatWallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
    await tx.fiatWallet.update({ where: { id: toWalletId }, data: { balance: { increment: receivedAmount } } });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId: fromWalletId,
        type: "TRANSFER_OUT",
        amount,
        currency: from.currency,
        description: `Transfer to ${to.currency} wallet`,
        reference: `${ref}-OUT`,
        metadata: JSON.stringify({ toWalletId, toCurrency: to.currency, receivedAmount }),
      },
    });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId: toWalletId,
        type: "TRANSFER_IN",
        amount: receivedAmount,
        currency: to.currency,
        description: `Transfer from ${from.currency} wallet`,
        reference: `${ref}-IN`,
        metadata: JSON.stringify({ fromWalletId, fromCurrency: from.currency, sentAmount: amount }),
      },
    });
  });

  return NextResponse.json({ success: true, receivedAmount, fromCurrency: from.currency, toCurrency: to.currency });
}
