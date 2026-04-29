import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.kycDocument.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents, kycStatus: session.kycStatus });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { docType, docNumber, country } = await req.json();

    if (!docType || !country) {
      return NextResponse.json({ error: "Document type and country are required" }, { status: 400 });
    }

    // Simulate automatic KYC approval for demo
    await prisma.$transaction([
      prisma.kycDocument.create({
        data: {
          userId: session.id,
          docType,
          docNumber: docNumber || "",
          country,
          status: "SUBMITTED",
        },
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { kycStatus: "VERIFIED", kycLevel: 1 },
      }),
    ]);

    return NextResponse.json({ success: true, kycStatus: "VERIFIED" });
  } catch {
    return NextResponse.json({ error: "KYC submission failed" }, { status: 500 });
  }
}
