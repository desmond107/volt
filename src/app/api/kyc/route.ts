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

    // In production, submissions go to PENDING for human review.
    // In development, auto-approve so the demo flow works end-to-end.
    const isProd = process.env.NODE_ENV === "production";
    const newKycStatus = isProd ? "PENDING" : "VERIFIED";

    await prisma.$transaction(async (tx) => {
      await tx.kycDocument.create({
        data: {
          userId: session.id,
          docType,
          docNumber: docNumber || "",
          country,
          status: "SUBMITTED",
        },
      });
      await tx.user.update({
        where: { id: session.id },
        data: {
          kycStatus: newKycStatus,
          ...(isProd ? {} : { kycLevel: 1 }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      kycStatus: newKycStatus,
      message: isProd
        ? "Your documents have been submitted and are pending review."
        : "Verified",
    });
  } catch {
    return NextResponse.json({ error: "KYC submission failed" }, { status: 500 });
  }
}
