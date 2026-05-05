import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRates, convertAmount, FALLBACK_RATES, CURRENCY_NAMES } from "@/lib/rates";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromWalletId, targetCurrency, amount } = await req.json();
  const target = targetCurrency?.toUpperCase();

  if (!fromWalletId || !target || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  if (!FALLBACK_RATES[target]) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  const from = await prisma.fiatWallet.findUnique({ where: { id: fromWalletId } });
  if (!from || from.userId !== session.id) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }
  if (from.currency === target) {
    return NextResponse.json({ error: "Source and target currencies are the same" }, { status: 400 });
  }
  if (from.balance.toNumber() < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const rates = await getRates();
  const received = convertAmount(amount, from.currency, target, rates);
  const rate = rates[target] / (rates[from.currency] ?? 1);
  const ref = `CONV-${Date.now()}`;

  // Find or create the target wallet
  let toWallet = await prisma.fiatWallet.findFirst({
    where: { userId: session.id, currency: target },
  });
  if (!toWallet) {
    toWallet = await prisma.fiatWallet.create({
      data: {
        userId: session.id,
        currency: target,
        name: CURRENCY_NAMES[target] ?? target,
        balance: 0,
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.fiatWallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
    await tx.fiatWallet.update({ where: { id: toWallet.id }, data: { balance: { increment: received } } });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId: fromWalletId,
        type: "CONVERT_OUT",
        amount,
        currency: from.currency,
        description: `Converted ${amount} ${from.currency} → ${target}`,
        reference: `${ref}-OUT`,
        metadata: JSON.stringify({ targetCurrency: target, received, rate }),
      },
    });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId: toWallet.id,
        type: "CONVERT_IN",
        amount: received,
        currency: target,
        description: `Converted from ${from.currency}`,
        reference: `${ref}-IN`,
        metadata: JSON.stringify({ sourceCurrency: from.currency, sent: amount, rate }),
      },
    });
  });

  return NextResponse.json({
    success: true,
    received,
    rate,
    fromCurrency: from.currency,
    targetCurrency: target,
    toWalletId: toWallet.id,
  });
}
