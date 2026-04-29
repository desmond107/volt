import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateCardNumber, generateCVV } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.virtualCard.findMany({
    where: { userId: session.id, status: { not: "TERMINATED" } },
    orderBy: { createdAt: "desc" },
    include: { wallet: { select: { id: true, asset: true, network: true, balance: true } } },
  });

  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.kycStatus !== "VERIFIED") {
    return NextResponse.json({ error: "KYC verification required to issue cards" }, { status: 403 });
  }

  try {
    const { label, spendLimit, color, currency } = await req.json();

    const now = new Date();
    const expiryYear = now.getFullYear() + 3;
    const expiryMonth = now.getMonth() + 1;

    const card = await prisma.virtualCard.create({
      data: {
        userId: session.id,
        cardNumber: generateCardNumber(),
        cvv: generateCVV(),
        expiryMonth,
        expiryYear,
        cardHolder: session.name ?? "STERLING USER",
        label: label || "Virtual Card",
        spendLimit: spendLimit || 1000,
        color: color || "#6366f1",
        currency: currency || "USD",
      },
    });

    return NextResponse.json({ card });
  } catch {
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
