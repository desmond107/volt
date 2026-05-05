import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wallet = await prisma.fiatWallet.findUnique({ where: { id } });

  if (!wallet || wallet.userId !== session.id) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  if (wallet.balance.toNumber() >= 0.01) {
    return NextResponse.json(
      { error: "Wallet still has funds. Transfer, convert or send to M-Pesa first." },
      { status: 400 }
    );
  }

  await prisma.fiatWallet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
