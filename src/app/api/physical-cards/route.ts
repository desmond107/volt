import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.physicalCardRequest.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    include: {
      fiatWallet: { select: { id: true, currency: true, name: true, balance: true } },
      virtualCard: { select: { id: true, label: true, color: true, brand: true, currency: true, walletId: true, fiatWalletId: true } },
    },
  });

  return NextResponse.json({
    request: request ? {
      ...request,
      fiatWallet: request.fiatWallet
        ? { ...request.fiatWallet, balance: request.fiatWallet.balance.toNumber() }
        : null,
    } : null,
  });
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

    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, cardColor, fiatWalletId, virtualCardId } = await req.json();

    if (!fullName?.trim() || !phone?.trim() || !addressLine1?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }

    const fieldLimits: Record<string, [string, number]> = {
      fullName:     [fullName,     100],
      phone:        [phone,         20],
      addressLine1: [addressLine1, 200],
      addressLine2: [addressLine2 ?? "", 200],
      city:         [city,          100],
      state:        [state ?? "",    100],
      postalCode:   [postalCode,     20],
      country:      [country,        100],
    };
    for (const [field, [value, max]] of Object.entries(fieldLimits)) {
      if (value.trim().length > max) {
        return NextResponse.json({ error: `${field} must be ${max} characters or fewer` }, { status: 400 });
      }
    }

    const validColors = ["midnight", "white", "navy", "gold", "rosegold", "arctic"];
    const resolvedColor = validColors.includes(cardColor) ? cardColor : "midnight";

    let resolvedFiatWalletId: string | null = null;
    if (fiatWalletId) {
      const wallet = await prisma.fiatWallet.findUnique({ where: { id: fiatWalletId } });
      if (!wallet || wallet.userId !== session.id) {
        return NextResponse.json({ error: "Fiat wallet not found" }, { status: 404 });
      }
      resolvedFiatWalletId = fiatWalletId;
    }

    let resolvedVirtualCardId: string | null = null;
    if (virtualCardId) {
      const vcard = await prisma.virtualCard.findUnique({ where: { id: virtualCardId } });
      if (!vcard || vcard.userId !== session.id) {
        return NextResponse.json({ error: "Digital Currency Card not found" }, { status: 404 });
      }
      resolvedVirtualCardId = virtualCardId;
      // Auto-link wallet from the virtual card if not already specified
      if (!resolvedFiatWalletId && vcard.fiatWalletId) {
        resolvedFiatWalletId = vcard.fiatWalletId;
      }
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
        cardColor: resolvedColor,
        ...(resolvedFiatWalletId ? { fiatWalletId: resolvedFiatWalletId } : {}),
        ...(resolvedVirtualCardId ? { virtualCardId: resolvedVirtualCardId } : {}),
      },
      include: {
        fiatWallet: { select: { id: true, currency: true, name: true, balance: true } },
        virtualCard: { select: { id: true, label: true, color: true, brand: true, currency: true, walletId: true, fiatWalletId: true } },
      },
    });

    return NextResponse.json({
      request: {
        ...request,
        fiatWallet: request.fiatWallet
          ? { ...request.fiatWallet, balance: request.fiatWallet.balance.toNumber() }
          : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const request = await prisma.physicalCardRequest.findFirst({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    if (!request) {
      return NextResponse.json({ error: "No card request found" }, { status: 404 });
    }

    if (!["PENDING", "REVIEWING"].includes(request.status)) {
      return NextResponse.json({ error: "Request cannot be cancelled at this stage" }, { status: 409 });
    }

    await prisma.physicalCardRequest.delete({ where: { id: request.id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}
