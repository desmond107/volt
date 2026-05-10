import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?verified=invalid", req.url));
  }

  try {
    const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?verified=invalid", req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerifyToken: null },
    });

    return NextResponse.redirect(new URL("/auth/login?verified=success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/auth/login?verified=error", req.url));
  }
}
