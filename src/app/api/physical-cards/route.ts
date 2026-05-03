import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.physicalCardRequest.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ request });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.kycStatus !== "VERIFIED") {
    return NextResponse.json({ error: "KYC verification is required to request a physical card" }, { status: 403 });
  }

  try {
    const existing = await prisma.physicalCardRequest.findFirst({
      where: { userId: session.id, status: { in: ["PENDING", "REVIEWING", "APPROVED", "SHIPPED"] } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have an active card request" }, { status: 409 });
    }

    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country } = await req.json();

    if (!fullName?.trim() || !phone?.trim() || !addressLine1?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }

    const request = await prisma.physicalCardRequest.create({
      data: {
        userId: session.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        city: city.trim(),
        state: state?.trim() || null,
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
    });

    return NextResponse.json({ request });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
