import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

const SUPPORTED_ASSETS: Record<string, string[]> = {
  USDC: ["Base", "BNB Smart Chain"],
  USDT: ["BNB Smart Chain"],
  DAI:  ["Base"],
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ wallets: serializeDecimals(wallets) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { asset, network } = await req.json();

  if (!asset || !SUPPORTED_ASSETS[asset]) {
    return NextResponse.json({ error: "Invalid asset. Supported: USDC, USDT, DAI" }, { status: 400 });
  }
  if (!network || !SUPPORTED_ASSETS[asset].includes(network)) {
    return NextResponse.json(
      { error: `${asset} is not available on ${network}` },
      { status: 400 }
    );
  }

  const existing = await prisma.wallet.findFirst({
    where: { userId: session.id, asset, network },
  });
  if (existing) {
    return NextResponse.json(
      { error: `You already have a ${asset} wallet on ${network}` },
      { status: 409 }
    );
  }

  const address = "0x" + randomBytes(20).toString("hex");

  const wallet = await prisma.wallet.create({
    data: { userId: session.id, asset, network, address },
  });

  return NextResponse.json({ wallet: serializeDecimals(wallet) }, { status: 201 });
}
