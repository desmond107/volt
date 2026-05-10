import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const keys = await prisma.apiKey.findMany({
    where: {
      userId: session.id,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true, name: true, key: true, permissions: true, lastUsed: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, permissions } = await req.json();

    const key = "sk_live_" + crypto.randomBytes(24).toString("hex");
    const secret = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.id,
        name: name || "Default Key",
        key,
        secret,
        permissions: permissions || "read",
        expiresAt,
      },
    });

    return NextResponse.json({ apiKey: { ...apiKey, secretOnce: secret } });
  } catch {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    await prisma.apiKey.update({ where: { id, userId: session.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
