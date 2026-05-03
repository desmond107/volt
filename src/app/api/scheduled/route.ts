import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";

function nextRunDate(frequency: string, from: Date = new Date()): Date {
  const d = new Date(from);
  switch (frequency) {
    case "DAILY":   d.setDate(d.getDate() + 1); break;
    case "WEEKLY":  d.setDate(d.getDate() + 7); break;
    case "MONTHLY": d.setMonth(d.getMonth() + 1); break;
    case "YEARLY":  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.scheduledPayment.findMany({
    where: { userId: session.id },
    include: { wallet: { select: { asset: true, network: true, balance: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payments: serializeDecimals(payments) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { walletId, toAddress, amount, currency, description, frequency } = await req.json();

  if (!walletId || !toAddress || !amount || !frequency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId: session.id } });
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  const payment = await prisma.scheduledPayment.create({
    data: {
      userId: session.id,
      walletId,
      toAddress,
      amount,
      currency: currency ?? "USD",
      description,
      frequency,
      nextRunAt: nextRunDate(frequency),
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ payment: serializeDecimals(payment) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payment = await prisma.scheduledPayment.findFirst({ where: { id, userId: session.id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.scheduledPayment.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ payment: serializeDecimals(updated) });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const payment = await prisma.scheduledPayment.findFirst({ where: { id, userId: session.id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.scheduledPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
