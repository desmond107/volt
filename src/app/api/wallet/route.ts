import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";
import { createCrossmintWallet } from "@/lib/crossmint";
import { getOrCreateStream, watchAddress } from "@/lib/moralis-streams";

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
    return NextResponse.json({ error: `${asset} is not available on ${network}` }, { status: 400 });
  }

  const existing = await prisma.wallet.findFirst({
    where: { userId: session.id, asset, network },
  });
  if (existing) {
    return NextResponse.json(
      { error: `You already have a ${asset} wallet on ${network}` },
      { status: 409 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Create a real on-chain wallet via Crossmint
    const { walletId: crossmintWalletId, address } = await createCrossmintWallet(
      user.email,
      network,
    );

    // 2. Register address with Moralis so incoming deposits trigger our webhook
    const streamId = await getOrCreateStream();
    await watchAddress(streamId, address);

    // 3. Persist wallet with Crossmint reference (address stored lowercase for consistent lookup)
    const wallet = await prisma.wallet.create({
      data: {
        userId: session.id,
        asset,
        network,
        address,
        crossmintWalletId,
      },
    });

    return NextResponse.json({ wallet: serializeDecimals(wallet) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
