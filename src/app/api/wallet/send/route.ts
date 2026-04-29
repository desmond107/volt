import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fromWalletId, toAddress, amount } = await req.json();

    if (!fromWalletId || !toAddress || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid send parameters" }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: fromWalletId } }),
      prisma.wallet.findUnique({
        where: { address: toAddress },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    if (!from || from.userId !== session.id) {
      return NextResponse.json({ error: "Source wallet not found" }, { status: 404 });
    }
    if (!to) {
      return NextResponse.json({ error: "Recipient wallet not found" }, { status: 404 });
    }
    if (to.userId === session.id) {
      return NextResponse.json({ error: "Cannot send to your own wallet" }, { status: 400 });
    }
    if (from.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const ref = `SEND-${Date.now()}`;
    const recipientName = to.user.name ?? to.user.email;

    await prisma.$transaction([
      prisma.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } }),
      prisma.wallet.update({ where: { id: to.id }, data: { balance: { increment: amount } } }),
      // Sender's outgoing transaction
      prisma.transaction.create({
        data: {
          userId: session.id,
          walletId: fromWalletId,
          type: "TRANSFER",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: from.asset,
          description: `Sent to ${recipientName}`,
          reference: `${ref}-OUT`,
          metadata: JSON.stringify({ direction: "out", recipientAddress: toAddress }),
        },
      }),
      // Recipient's incoming transaction
      prisma.transaction.create({
        data: {
          userId: to.userId,
          walletId: to.id,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: to.asset,
          description: `Received ${from.asset}`,
          reference: `${ref}-IN`,
          metadata: JSON.stringify({ direction: "in", senderUserId: session.id }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, recipientName });
  } catch {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
