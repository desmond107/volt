import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const asset = searchParams.get("asset");

    if (!q || !asset) {
      return NextResponse.json({ error: "Missing query or asset" }, { status: 400 });
    }

    const isAddress = q.startsWith("0x") && q.length === 42;

    const walletWithUser = isAddress
      ? await prisma.wallet.findUnique({
          where: { address: q },
          include: { user: { select: { id: true, name: true, email: true } } },
        })
      : await prisma.wallet.findFirst({
          where: {
            asset,
            user: { email: q.toLowerCase() },
          },
          include: { user: { select: { id: true, name: true, email: true } } },
        });

    if (!walletWithUser) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    if (walletWithUser.user.id === session.id) {
      return NextResponse.json({ error: "Cannot send to your own wallet" }, { status: 400 });
    }

    return NextResponse.json({
      name: walletWithUser.user.name ?? walletWithUser.user.email,
      email: walletWithUser.user.email,
      address: walletWithUser.address,
      asset: walletWithUser.asset,
      network: walletWithUser.network,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
