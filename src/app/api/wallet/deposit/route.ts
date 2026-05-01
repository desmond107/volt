import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { walletId, amount, paymentMethod, cardBrand, cardLast4, mpesaPhone } = await req.json();
    if (!walletId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid deposit parameters" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.userId !== session.id) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    let description = `Deposit to ${wallet.asset} wallet`;
    if (paymentMethod === "card" && cardBrand && cardLast4) {
      description = `${cardBrand === "visa" ? "Visa" : "Mastercard"} ···· ${cardLast4} → ${wallet.asset}`;
    } else if (paymentMethod === "mpesa" && mpesaPhone) {
      description = `M-Pesa +254${mpesaPhone} → ${wallet.asset}`;
    }

    const metadata = JSON.stringify({ paymentMethod: paymentMethod || "direct", cardBrand, cardLast4, mpesaPhone });

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.id,
          walletId,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: wallet.asset,
          description,
          reference: `DEP-${Date.now()}`,
          metadata,
        },
      }),
    ]);

    return NextResponse.json(serializeDecimals({ wallet: updatedWallet, transaction }));
  } catch {
    return NextResponse.json({ error: "Deposit failed" }, { status: 500 });
  }
}
