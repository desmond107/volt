import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await prisma.wallet.findMany({ where: { userId: session.id } });

  // Add balances to wallets
  await Promise.all(
    wallets.map((w) =>
      prisma.wallet.update({
        where: { id: w.id },
        data: { balance: w.asset === "USDC" ? 2450 : w.asset === "USDT" ? 800 : 300 },
      })
    )
  );

  // Add sample transactions
  const usdcWallet = wallets.find((w) => w.asset === "USDC");
  if (usdcWallet) {
    const txns = [
      { type: "DEPOSIT", status: "COMPLETED", amount: 2450, currency: "USDC", description: "Initial deposit", merchant: null },
      { type: "CARD_PAYMENT", status: "COMPLETED", amount: 49.99, currency: "USD", merchant: "Netflix", category: "Entertainment" },
      { type: "CARD_PAYMENT", status: "COMPLETED", amount: 12.99, currency: "USD", merchant: "Spotify", category: "Entertainment" },
      { type: "CARD_PAYMENT", status: "COMPLETED", amount: 234.50, currency: "USD", merchant: "Amazon", category: "Shopping" },
      { type: "CARD_PAYMENT", status: "COMPLETED", amount: 8.50, currency: "USD", merchant: "Uber Eats", category: "Food" },
    ];

    for (const t of txns) {
      await prisma.transaction.create({
        data: {
          userId: session.id,
          walletId: usdcWallet.id,
          ...t,
          fee: t.type === "CARD_PAYMENT" ? +(t.amount * 0.01).toFixed(2) : 0,
          reference: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        },
      });
    }
  }

  // Update user KYC to verified
  await prisma.user.update({
    where: { id: session.id },
    data: { kycStatus: "VERIFIED", kycLevel: 1 },
  });

  return NextResponse.json({ ok: true, message: "Demo data seeded successfully" });
}
