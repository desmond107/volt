import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CURRENCY_NAMES } from "@/lib/rates";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromWalletId, recipientEmail, amount } = await req.json();
  if (!fromWalletId || !recipientEmail || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const from = await prisma.fiatWallet.findUnique({ where: { id: fromWalletId } });
  if (!from || from.userId !== session.id) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }
  if (from.balance.toNumber() < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { email: recipientEmail.trim().toLowerCase() } });
  if (!recipient) {
    return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
  }
  if (recipient.id === session.id) {
    return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 });
  }

  // Find or create recipient's wallet in the same currency
  let toWallet = await prisma.fiatWallet.findFirst({
    where: { userId: recipient.id, currency: from.currency },
  });
  if (!toWallet) {
    toWallet = await prisma.fiatWallet.create({
      data: {
        userId: recipient.id,
        currency: from.currency,
        name: CURRENCY_NAMES[from.currency] ?? from.currency,
        balance: 0,
      },
    });
  }

  const ref = `SEND-${Date.now()}`;
  const recipientName = recipient.name ?? recipient.email;

  await prisma.$transaction(async (tx) => {
    await tx.fiatWallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
    await tx.fiatWallet.update({ where: { id: toWallet.id }, data: { balance: { increment: amount } } });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId: fromWalletId,
        type: "SEND",
        amount,
        currency: from.currency,
        description: `Sent to ${recipientName}`,
        reference: `${ref}-OUT`,
        metadata: JSON.stringify({ direction: "out", recipientEmail, recipientName }),
      },
    });
    await tx.fiatTransaction.create({
      data: {
        userId: recipient.id,
        walletId: toWallet.id,
        type: "RECEIVE",
        amount,
        currency: from.currency,
        description: `Received from ${session.name ?? session.email}`,
        reference: `${ref}-IN`,
        metadata: JSON.stringify({ direction: "in", senderUserId: session.id }),
      },
    });
  });

  return NextResponse.json({ success: true, recipientName });
}
