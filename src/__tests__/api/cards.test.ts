import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Card User", kycStatus: "VERIFIED", kycLevel: 1 };
const unverifiedSession = { ...mockSession, kycStatus: "PENDING" };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    virtualCard: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    wallet: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, generateCardNumber: vi.fn(() => "1234567890123456"), generateCVV: vi.fn(() => "123") };
});

function makeRequest(body: object, id = "card-1") {
  return new NextRequest(`http://localhost/api/cards/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/cards ─────────────────────────────────────────────────────────

describe("GET /api/cards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/cards/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only non-terminated cards", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findMany).mockResolvedValue([
      { id: "card-1", status: "ACTIVE", label: "My Card" },
    ] as never);

    const { GET } = await import("@/app/api/cards/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cards).toHaveLength(1);
    expect(prisma.virtualCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: { not: "TERMINATED" } }) })
    );
  });
});

// ── POST /api/cards ────────────────────────────────────────────────────────

describe("POST /api/cards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/cards/route");
    const req = new NextRequest("http://localhost/api/cards", { method: "POST", body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when KYC not verified", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(unverifiedSession);

    const { POST } = await import("@/app/api/cards/route");
    const req = new NextRequest("http://localhost/api/cards", { method: "POST", body: JSON.stringify({ label: "Test" }) });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/KYC/i);
  });

  it("creates a card with generated number and CVV", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.create).mockResolvedValue({
      id: "card-1",
      cardNumber: "1234567890123456",
      cvv: "123",
      label: "Shopping",
    } as never);

    const { POST } = await import("@/app/api/cards/route");
    const req = new NextRequest("http://localhost/api/cards", {
      method: "POST",
      body: JSON.stringify({ label: "Shopping", spendLimit: 500, color: "#ff0000", currency: "USD" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.card.cardNumber).toBe("1234567890123456");
    expect(json.card.cvv).toBe("123");
  });

  it("sets expiry 3 years from now", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.create).mockResolvedValue({ id: "c1" } as never);

    const { POST } = await import("@/app/api/cards/route");
    const req = new NextRequest("http://localhost/api/cards", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await POST(req);

    const createCall = vi.mocked(prisma.virtualCard.create).mock.calls[0][0].data;
    const expectedYear = new Date().getFullYear() + 3;
    expect(createCall.expiryYear).toBe(expectedYear);
  });
});

// ── POST /api/cards/[id]/fund ──────────────────────────────────────────────

describe("POST /api/cards/[id]/fund", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: 50 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid amount", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: -10 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when card not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: 50 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when no wallet linked", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", wallet: null,
    } as never);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: 50 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no wallet/i);
  });

  it("returns 400 for insufficient wallet balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1",
      wallet: { id: "w1", balance: 20, asset: "USDC" },
    } as never);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: 100 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("funds card successfully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", label: "Travel",
      wallet: { id: "w1", balance: 500, asset: "USDC" },
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: "w1", balance: 450 },
      { id: "card-1", balance: 50 },
      { id: "tx1" },
    ] as never);

    const { POST } = await import("@/app/api/cards/[id]/fund/route");
    const res = await POST(makeRequest({ amount: 50 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.cardBalance).toBe(50);
    expect(json.walletBalance).toBe(450);
  });
});

// ── POST /api/cards/[id]/pay ───────────────────────────────────────────────

describe("POST /api/cards/[id]/pay", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/cards/[id]/pay/route");
    const res = await POST(makeRequest({ amount: 20 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when card is frozen", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", status: "FROZEN",
      balance: 100, spendLimit: 500, spentAmount: 0, currency: "USD",
    } as never);

    const { POST } = await import("@/app/api/cards/[id]/pay/route");
    const res = await POST(makeRequest({ amount: 20 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/frozen/i);
  });

  it("returns 400 for insufficient card balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", status: "ACTIVE",
      balance: 10, spendLimit: 500, spentAmount: 0, currency: "USD",
    } as never);

    const { POST } = await import("@/app/api/cards/[id]/pay/route");
    const res = await POST(makeRequest({ amount: 50 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient card balance/i);
  });

  it("returns 400 when spend limit is exceeded", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", status: "ACTIVE",
      balance: 1000, spendLimit: 100, spentAmount: 90, currency: "USD",
    } as never);

    const { POST } = await import("@/app/api/cards/[id]/pay/route");
    const res = await POST(makeRequest({ amount: 20 }), { params: Promise.resolve({ id: "card-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/spend limit/i);
  });

  it("processes payment and updates balance and spentAmount", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.virtualCard.findUnique).mockResolvedValue({
      id: "card-1", userId: "user-1", status: "ACTIVE",
      balance: 200, spendLimit: 500, spentAmount: 50, currency: "USD",
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: "card-1", balance: 170, spentAmount: 80 },
      { id: "tx1" },
    ] as never);

    const { POST } = await import("@/app/api/cards/[id]/pay/route");
    const res = await POST(
      makeRequest({ amount: 30, merchant: "Coffee Shop", category: "Food" }),
      { params: Promise.resolve({ id: "card-1" }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.balance).toBe(170);
    expect(json.spentAmount).toBe(80);
  });
});
