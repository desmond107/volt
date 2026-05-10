import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, kycStatus: true, kycLevel: true, createdAt: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, currentPassword, newPassword } = await req.json();

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const valid = await verifyPassword(currentPassword ?? "", user.passwordHash);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      const pwdError = validatePassword(newPassword);
      if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });
      await prisma.user.update({
        where: { id: session.id },
        data: { passwordHash: await hashPassword(newPassword) },
      });
      // Invalidate current session — client must re-authenticate with the new password
      await clearSession();
      return NextResponse.json({ ok: true, requireRelogin: true });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
      }
      await prisma.user.update({ where: { id: session.id }, data: { name: name.trim() } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
