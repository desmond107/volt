import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRates, convertAmount } from "@/lib/rates";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { walletId, phone, amount } = await req.json();
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!walletId || !amount || amount <= 0 || digits.length < 9) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const wallet = await prisma.fiatWallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== session.id) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }
  if (wallet.balance.toNumber() < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const rates = await getRates();
  const kesAmount = convertAmount(amount, wallet.currency, "KES", rates);
  const formattedPhone = `+254${digits.slice(-9)}`;
  const ref = `MPESA-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.fiatWallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } },
    });
    await tx.fiatTransaction.create({
      data: {
        userId: session.id,
        walletId,
        type: "MPESA_SEND",
        amount,
        currency: wallet.currency,
        description: `M-Pesa send to ${formattedPhone}`,
        reference: ref,
        metadata: JSON.stringify({
          phone: formattedPhone,
          kesAmount,
          rate: kesAmount / amount,
          sourceCurrency: wallet.currency,
        }),
      },
    });
  });

  return NextResponse.json({
    success: true,
    kesAmount,
    phone: formattedPhone,
    deducted: amount,
    currency: wallet.currency,
  });
}
