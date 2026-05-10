import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/auth";
import { setSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// IP-level rate limit: max 20 login attempts per IP per 15 minutes
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const IP_MAX = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }
  if (entry.count >= IP_MAX) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (isIpRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts from this IP. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if account is locked
    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.loginLockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` },
        { status: 429 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(locked && { loginLockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }),
        },
      });

      if (locked) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.` },
          { status: 429 }
        );
      }

      const remaining = MAX_ATTEMPTS - attempts;
      return NextResponse.json(
        { error: `Invalid email or password. ${remaining} attempt(s) remaining.` },
        { status: 401 }
      );
    }

    // Successful login — reset attempt counter
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, loginLockedUntil: null },
    });

    await setSession(user.id);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, kycStatus: user.kycStatus },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
