import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const card = await prisma.virtualCard.findUnique({ where: { id } });
  if (!card || card.userId !== session.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (body.walletId) {
    const wallet = await prisma.wallet.findUnique({ where: { id: body.walletId } });
    if (!wallet || wallet.userId !== session.id) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
  }

  const updated = await prisma.virtualCard.update({
    where: { id },
    data: {
      ...(body.status !== undefined     && { status: body.status }),
      ...(body.label !== undefined      && { label: body.label }),
      ...(body.spendLimit !== undefined && { spendLimit: body.spendLimit }),
      ...(body.nfcEnabled !== undefined && { nfcEnabled: body.nfcEnabled }),
      ...("walletId" in body            && { walletId: body.walletId ?? null }),
    },
    include: { wallet: { select: { id: true, asset: true, network: true, balance: true } } },
  });

  return NextResponse.json({ card: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const card = await prisma.virtualCard.findUnique({ where: { id } });
  if (!card || card.userId !== session.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await prisma.virtualCard.update({
    where: { id },
    data: { status: "TERMINATED" },
  });

  return NextResponse.json({ ok: true });
}
