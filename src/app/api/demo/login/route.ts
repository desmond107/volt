import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

const DEMO_EMAIL = "demo@zpesa.com";
const DEMO_NAME = "Demo User";

function genAddress() {
  const chars = "0123456789abcdef";
  return "0x" + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST() {
  try {
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

    if (!user) {
      const passwordHash = await hashPassword("demo-password-zpesa");
      user = await prisma.user.create({
        data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash, kycStatus: "VERIFIED", kycLevel: 1 },
      });

      await prisma.wallet.createMany({
        data: [
          { userId: user.id, asset: "USDC", network: "Base", address: genAddress(), balance: 2450 },
          { userId: user.id, asset: "USDT", network: "BSC", address: genAddress(), balance: 800 },
          { userId: user.id, asset: "DAI", network: "Base", address: genAddress(), balance: 300 },
        ],
      });

      const usdcWallet = await prisma.wallet.findFirst({ where: { userId: user.id, asset: "USDC" } });

      if (usdcWallet) {
        const txns = [
          { type: "DEPOSIT", status: "COMPLETED", amount: 2450, currency: "USDC", description: "Initial deposit", merchant: null, category: null },
          { type: "CARD_PAYMENT", status: "COMPLETED", amount: 49.99, currency: "USD", merchant: "Netflix", category: "Entertainment", description: null },
          { type: "CARD_PAYMENT", status: "COMPLETED", amount: 12.99, currency: "USD", merchant: "Spotify", category: "Entertainment", description: null },
          { type: "CARD_PAYMENT", status: "COMPLETED", amount: 234.50, currency: "USD", merchant: "Amazon", category: "Shopping", description: null },
          { type: "CARD_PAYMENT", status: "COMPLETED", amount: 8.50, currency: "USD", merchant: "Uber Eats", category: "Food", description: null },
          { type: "DEPOSIT", status: "COMPLETED", amount: 500, currency: "USDT", description: "Top up", merchant: null, category: null },
          { type: "CARD_PAYMENT", status: "COMPLETED", amount: 29.99, currency: "USD", merchant: "Adobe CC", category: "Software", description: null },
        ];

        for (const t of txns) {
          await prisma.transaction.create({
            data: {
              userId: user.id,
              walletId: usdcWallet.id,
              ...t,
              fee: t.type === "CARD_PAYMENT" ? +(t.amount * 0.01).toFixed(2) : 0,
              reference: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            },
          });
        }
      }

      await prisma.kycDocument.create({
        data: { userId: user.id, docType: "passport", country: "Kenya", status: "VERIFIED" },
      });

      const now = new Date();
      await prisma.virtualCard.create({
        data: {
          userId: user.id,
          cardNumber: "4111111111114921",
          cvv: "392",
          expiryMonth: now.getMonth() + 1,
          expiryYear: now.getFullYear() + 3,
          cardHolder: DEMO_NAME,
          label: "Shopping Card",
          spendLimit: 1000,
          spentAmount: 335.97,
          color: "#1a56db",
          currency: "USD",
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { kycStatus: "VERIFIED", kycLevel: 1 },
      });
    }

    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Demo login failed" }, { status: 500 });
  }
}
