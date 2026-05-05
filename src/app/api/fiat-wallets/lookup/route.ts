import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
  if (user.id === session.id) return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 });

  return NextResponse.json({ name: user.name ?? user.email, email: user.email });
}
