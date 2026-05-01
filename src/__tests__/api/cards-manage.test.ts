import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    virtualCard: { findUnique: vi.fn(), update: vi.fn() },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function patchReq(body: object, id = "card-1") {
  return new NextRequest(`http://localhost/api/cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function deleteReq(id = "card-1") {
  return new NextRequest(`http://localhost/api/cards/${id}`, { method: "DELETE" });
}

// ── PATCH /api/cards/[id] ──────────────────────────────────────────────────

describe("PATCH /api/cards/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ status: "FROZEN" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when card not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ status: "FROZEN" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when card belongs to another user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({ id: "card-1", userId: "other" } as never);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ status: "FROZEN" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when linked wallet belongs to another user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({ id: "card-1", userId: "user-1" } as never);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "other" } as never);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ walletId: "w1" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(404);
  });

  it("freezes a card successfully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({ id: "card-1", userId: "user-1" } as never);
    vi.mocked(prisma.virtualCard.update).mockResolvedValue({ id: "card-1", status: "FROZEN" } as never);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ status: "FROZEN" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.card.status).toBe("FROZEN");
  });

  it("links a wallet to a card", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({ id: "card-1", userId: "user-1" } as never);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "user-1" } as never);
    vi.mocked(prisma.virtualCard.update).mockResolvedValue({ id: "card-1", walletId: "w1" } as never);

    const { PATCH } = await import("@/app/api/cards/[id]/route");
    const res = await PATCH(patchReq({ walletId: "w1" }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    expect(prisma.virtualCard.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ walletId: "w1" }) })
    );
  });
});

// ── DELETE /api/cards/[id] ─────────────────────────────────────────────────

describe("DELETE /api/cards/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when card not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(404);
  });

  it("terminates card with no balance and returns refunded: 0", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", balance: new Prisma.Decimal(0), wallet: null, label: "My Card",
    } as never);
    vi.mocked(prisma.virtualCard.update).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.refunded).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.virtualCard.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "TERMINATED" } })
    );
  });

  it("terminates card with balance but no wallet and returns refunded: 0", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", balance: new Prisma.Decimal(50), wallet: null, label: "My Card",
    } as never);
    vi.mocked(prisma.virtualCard.update).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.refunded).toBe(0);
  });

  it("refunds balance to wallet when card has balance and linked wallet", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", balance: new Prisma.Decimal(75), label: "Travel Card",
      wallet: { id: "w1", asset: "USDC", balance: new Prisma.Decimal(100) },
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}] as never);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    const res = await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.refunded).toBe(75);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("creates a DEPOSIT transaction record for the refund", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", balance: new Prisma.Decimal(30), label: "Shopping",
      wallet: { id: "w1", asset: "USDT", balance: new Prisma.Decimal(200) },
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}] as never);

    const { DELETE } = await import("@/app/api/cards/[id]/route");
    await DELETE(deleteReq(), { params: Promise.resolve({ id: "card-1" }) });

    const txArgs = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown[];
    expect(txArgs).toHaveLength(3);
  });
});
