import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

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
