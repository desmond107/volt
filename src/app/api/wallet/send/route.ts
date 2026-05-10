import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendStablecoin } from "@/lib/crossmint";
import { genRef } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fromWalletId, toAddress, amount } = await req.json();

    if (!fromWalletId || !toAddress || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid send parameters" }, { status: 400 });
    }
    if (amount > 50_000) {
      return NextResponse.json({ error: "Single send cannot exceed $50,000" }, { status: 400 });
    }

    const from = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
    if (!from || from.userId !== session.id) {
      return NextResponse.json({ error: "Source wallet not found" }, { status: 404 });
    }
    if (from.balance.toNumber() < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Check if the recipient is another Volt user's wallet
    const internalWallet = await prisma.wallet.findUnique({
      where: { address: toAddress.toLowerCase() },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (internalWallet?.userId === session.id) {
      return NextResponse.json({ error: "Cannot send to your own wallet" }, { status: 400 });
    }

    const ref = genRef("SEND");

    if (internalWallet) {
      // ── Internal Volt-to-Volt transfer ─────────────────────────────────────
      const recipientName = internalWallet.user.name ?? internalWallet.user.email;
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
        await tx.wallet.update({ where: { id: internalWallet.id }, data: { balance: { increment: amount } } });
        await tx.transaction.create({
          data: {
            userId: session.id, walletId: fromWalletId, type: "TRANSFER",
            status: "COMPLETED", amount, fee: 0, currency: from.asset,
            description: `Sent to ${recipientName}`,
            reference: `${ref}-OUT`,
            metadata: JSON.stringify({ direction: "out", recipientAddress: toAddress, internal: true }),
          },
        });
        await tx.transaction.create({
          data: {
            userId: internalWallet.userId, walletId: internalWallet.id, type: "DEPOSIT",
            status: "COMPLETED", amount, fee: 0, currency: internalWallet.asset,
            description: `Received ${from.asset} from Volt user`,
            reference: `${ref}-IN`,
            metadata: JSON.stringify({ direction: "in", senderUserId: session.id, internal: true }),
          },
        });
      });
      return NextResponse.json({ success: true, recipientName, type: "internal" });
    }

    // ── External on-chain send via Crossmint ────────────────────────────────
    if (!from.crossmintWalletId) {
      return NextResponse.json(
        { error: "This wallet predates on-chain support. Please create a new wallet." },
        { status: 400 },
      );
    }

    // Deduct balance and record as PENDING immediately
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
      await tx.transaction.create({
        data: {
          userId: session.id, walletId: fromWalletId, type: "TRANSFER",
          status: "PENDING", amount, fee: 0, currency: from.asset,
          description: `Sent ${from.asset} to ${toAddress.slice(0, 6)}…${toAddress.slice(-4)}`,
          reference: ref,
          metadata: JSON.stringify({ direction: "out", recipientAddress: toAddress, onChain: true }),
        },
      });
    });

    // Broadcast on-chain — update status once Crossmint confirms, refund on failure
    sendStablecoin(from.crossmintWalletId, toAddress, from.asset, from.network, amount)
      .then((crossmintTxId) => {
        prisma.transaction.update({
          where: { reference: ref },
          data: {
            status: "COMPLETED",
            metadata: JSON.stringify({ direction: "out", recipientAddress: toAddress, onChain: true, crossmintTxId }),
          },
        }).catch(() => { /* best-effort */ });
      })
      .catch(() => {
        prisma.$transaction([
          prisma.wallet.update({ where: { id: fromWalletId }, data: { balance: { increment: amount } } }),
          prisma.transaction.update({ where: { reference: ref }, data: { status: "FAILED" } }),
        ]).catch(() => { /* best-effort */ });
      });

    return NextResponse.json({ success: true, type: "onchain", status: "pending" });
  } catch {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
