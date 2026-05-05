import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CURRENCY_NAMES, FALLBACK_RATES } from "@/lib/rates";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await prisma.fiatWallet.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    wallets: wallets.map((w) => ({
      id: w.id,
      currency: w.currency,
      name: w.name,
      balance: w.balance.toNumber(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currency, name } = await req.json();
  const code = currency?.toUpperCase();

  if (!code || !FALLBACK_RATES[code]) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  const existing = await prisma.fiatWallet.findFirst({
    where: { userId: session.id, currency: code },
  });
  if (existing) {
    return NextResponse.json({ error: `You already have a ${code} wallet` }, { status: 409 });
  }

  const wallet = await prisma.fiatWallet.create({
    data: {
      userId: session.id,
      currency: code,
      name: name?.trim() || (CURRENCY_NAMES[code] ?? code),
    },
  });

  return NextResponse.json({
    wallet: { id: wallet.id, currency: wallet.currency, name: wallet.name, balance: 0 },
  });
}
