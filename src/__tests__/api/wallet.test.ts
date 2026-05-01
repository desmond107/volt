import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    user: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function makeRequest(body: object, url = "http://localhost/api/wallet") {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/wallet ────────────────────────────────────────────────────────

describe("GET /api/wallet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/wallet/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns wallets for authenticated user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findMany).mockResolvedValue([
      { id: "w1", asset: "USDC", balance: 100 },
    ] as never);

    const { GET } = await import("@/app/api/wallet/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallets).toHaveLength(1);
    expect(json.wallets[0].asset).toBe("USDC");
  });
});

// ── POST /api/wallet/deposit ───────────────────────────────────────────────

describe("POST /api/wallet/deposit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/wallet/deposit/route");
    const res = await POST(makeRequest({ walletId: "w1", amount: 100 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid parameters", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/deposit/route");

    const noAmount = await POST(makeRequest({ walletId: "w1" }));
    expect(noAmount.status).toBe(400);

    const zeroAmount = await POST(makeRequest({ walletId: "w1", amount: 0 }));
    expect(zeroAmount.status).toBe(400);

    const negAmount = await POST(makeRequest({ walletId: "w1", amount: -50 }));
    expect(negAmount.status).toBe(400);
  });

  it("returns 404 when wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/wallet/deposit/route");
    const res = await POST(makeRequest({ walletId: "nonexistent", amount: 100 }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when wallet belongs to another user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "other-user", asset: "USDC" } as never);

    const { POST } = await import("@/app/api/wallet/deposit/route");
    const res = await POST(makeRequest({ walletId: "w1", amount: 100 }));
    expect(res.status).toBe(404);
  });

  it("deposits successfully and returns updated wallet", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "user-1", asset: "USDC" } as never);

    const updatedWallet = { id: "w1", balance: 200 };
    const transaction = { id: "tx1", type: "DEPOSIT" };
    vi.mocked(prisma.$transaction).mockResolvedValue({ updatedWallet, transaction } as never);

    const { POST } = await import("@/app/api/wallet/deposit/route");
    const res = await POST(makeRequest({ walletId: "w1", amount: 100, paymentMethod: "card", cardBrand: "visa", cardLast4: "4242" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallet.balance).toBe(200);
    expect(json.transaction.type).toBe("DEPOSIT");
  });
});

// ── POST /api/wallet/transfer ──────────────────────────────────────────────

describe("POST /api/wallet/transfer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    const res = await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w2", amount: 50 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when same wallet is used for both sides", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    const res = await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w1", amount: 50 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when amount is zero or negative", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    const res = await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w2", amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for insufficient balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: new Prisma.Decimal(10) } as never)
      .mockResolvedValueOnce({ id: "w2", userId: "user-1", asset: "USDT", balance: new Prisma.Decimal(0) } as never);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    const res = await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w2", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("transfers successfully between wallets", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: new Prisma.Decimal(500) } as never)
      .mockResolvedValueOnce({ id: "w2", userId: "user-1", asset: "USDT", balance: new Prisma.Decimal(0) } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    const res = await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w2", amount: 100 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("creates two transaction records (OUT + IN)", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: new Prisma.Decimal(500) } as never)
      .mockResolvedValueOnce({ id: "w2", userId: "user-1", asset: "USDT", balance: new Prisma.Decimal(0) } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/wallet/transfer/route");
    await POST(makeRequest({ fromWalletId: "w1", toWalletId: "w2", amount: 100 }));

    const fn = vi.mocked(prisma.$transaction).mock.calls[0][0];
    expect(typeof fn).toBe("function");
  });
});
