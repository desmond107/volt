import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1, emailVerifiedAt: null };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    fiatWallet: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    fiatTransaction: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/rates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rates")>();
  return {
    ...actual,
    getRates: vi.fn().mockResolvedValue(actual.FALLBACK_RATES),
  };
});

function makeReq(url: string, body?: object, method = "POST") {
  return new NextRequest(url, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
  });
}

// ── GET /api/fiat-wallets ──────────────────────────────────────────────────

describe("GET /api/fiat-wallets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/fiat-wallets/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns wallets for authenticated user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findMany).mockResolvedValue([
      { id: "fw1", currency: "USD", name: "US Dollar", balance: new Prisma.Decimal(500) },
      { id: "fw2", currency: "KES", name: "Kenyan Shilling", balance: new Prisma.Decimal(1000) },
    ] as never);

    const { GET } = await import("@/app/api/fiat-wallets/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallets).toHaveLength(2);
    expect(json.wallets[0].currency).toBe("USD");
    expect(json.wallets[0].balance).toBe(500);
  });
});

// ── POST /api/fiat-wallets ─────────────────────────────────────────────────

describe("POST /api/fiat-wallets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets", { currency: "USD" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an unsupported currency", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets", { currency: "FAKE" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid currency/i);
  });

  it("returns 409 when wallet for that currency already exists", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findFirst).mockResolvedValue({ id: "fw1" } as never);

    const { POST } = await import("@/app/api/fiat-wallets/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets", { currency: "USD" }));
    expect(res.status).toBe(409);
  });

  it("creates wallet with default currency name when no name given", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.fiatWallet.create).mockResolvedValue({
      id: "fw-new", currency: "USD", name: "US Dollar", balance: new Prisma.Decimal(0),
    } as never);

    const { POST } = await import("@/app/api/fiat-wallets/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets", { currency: "usd" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallet.currency).toBe("USD");
    expect(json.wallet.balance).toBe(0);
  });

  it("creates wallet with custom name when provided", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.fiatWallet.create).mockResolvedValue({
      id: "fw-new", currency: "EUR", name: "My Euro", balance: new Prisma.Decimal(0),
    } as never);

    const { POST } = await import("@/app/api/fiat-wallets/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets", { currency: "EUR", name: "My Euro" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallet.name).toBe("My Euro");
  });
});

// ── DELETE /api/fiat-wallets/[id] ─────────────────────────────────────────

describe("DELETE /api/fiat-wallets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeDeleteReq(id: string) {
    return new NextRequest(`http://localhost/api/fiat-wallets/${id}`, { method: "DELETE" });
  }

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/fiat-wallets/[id]/route");
    const res = await DELETE(makeDeleteReq("fw1"), { params: Promise.resolve({ id: "fw1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/fiat-wallets/[id]/route");
    const res = await DELETE(makeDeleteReq("fw1"), { params: Promise.resolve({ id: "fw1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when wallet still has funds", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", balance: new Prisma.Decimal(100),
    } as never);

    const { DELETE } = await import("@/app/api/fiat-wallets/[id]/route");
    const res = await DELETE(makeDeleteReq("fw1"), { params: Promise.resolve({ id: "fw1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/funds/i);
  });

  it("deletes empty wallet successfully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", balance: new Prisma.Decimal(0),
    } as never);
    vi.mocked(prisma.fiatWallet.delete).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/fiat-wallets/[id]/route");
    const res = await DELETE(makeDeleteReq("fw1"), { params: Promise.resolve({ id: "fw1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ── POST /api/fiat-wallets/deposit ─────────────────────────────────────────

describe("POST /api/fiat-wallets/deposit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/deposit/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/deposit", { walletId: "fw1", amount: 100 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing or invalid parameters", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/deposit/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/deposit", { walletId: "fw1", amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when amount exceeds max deposit limit", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/deposit/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/deposit", { walletId: "fw1", amount: 300_000 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/200,000/);
  });

  it("returns 404 when wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/deposit/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/deposit", { walletId: "none", amount: 100 }));
    expect(res.status).toBe(404);
  });

  it("deposits successfully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD",
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/fiat-wallets/deposit/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/deposit", { walletId: "fw1", amount: 500 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ── POST /api/fiat-wallets/transfer ────────────────────────────────────────

describe("POST /api/fiat-wallets/transfer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", toWalletId: "fw2", amount: 100 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing parameters", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", amount: 100 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when transfer exceeds limit", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", toWalletId: "fw2", amount: 100_000 }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when source wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "fw2", userId: "user-1", currency: "KES", balance: new Prisma.Decimal(0) } as never);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", toWalletId: "fw2", amount: 50 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for insufficient balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique)
      .mockResolvedValueOnce({ id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(10) } as never)
      .mockResolvedValueOnce({ id: "fw2", userId: "user-1", currency: "KES", balance: new Prisma.Decimal(0) } as never);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", toWalletId: "fw2", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("transfers successfully and returns converted amount", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique)
      .mockResolvedValueOnce({ id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500) } as never)
      .mockResolvedValueOnce({ id: "fw2", userId: "user-1", currency: "KES", balance: new Prisma.Decimal(0) } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/fiat-wallets/transfer/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/transfer", { fromWalletId: "fw1", toWalletId: "fw2", amount: 100 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.receivedAmount).toBeGreaterThan(0);
    expect(json.toCurrency).toBe("KES");
  });
});

// ── POST /api/fiat-wallets/send ────────────────────────────────────────────

describe("POST /api/fiat-wallets/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "a@b.com", amount: 50 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing parameters", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", amount: 50 }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when sender wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "alice@example.com", amount: 50 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for insufficient balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(10),
    } as never);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "alice@example.com", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("returns 404 when recipient user does not exist", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500),
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "nobody@example.com", amount: 50 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when sending to yourself", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500),
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", email: "user@example.com", name: "Test User" } as never);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "user@example.com", amount: 50 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/yourself/i);
  });

  it("sends successfully and returns recipient name", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500),
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-2", email: "alice@example.com", name: "Alice" } as never);
    vi.mocked(prisma.fiatWallet.findFirst).mockResolvedValue({ id: "fw2", userId: "user-2", currency: "USD", balance: new Prisma.Decimal(0) } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/fiat-wallets/send/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/send", { fromWalletId: "fw1", recipientEmail: "alice@example.com", amount: 50 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.recipientName).toBe("Alice");
  });
});

// ── GET /api/fiat-wallets/lookup ───────────────────────────────────────────

describe("GET /api/fiat-wallets/lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/fiat-wallets/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/fiat-wallets/lookup"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when email param is missing", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { GET } = await import("@/app/api/fiat-wallets/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/fiat-wallets/lookup"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { GET } = await import("@/app/api/fiat-wallets/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/fiat-wallets/lookup?email=nobody@example.com"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when looking up yourself", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", name: "Test User", email: "user@example.com" } as never);

    const { GET } = await import("@/app/api/fiat-wallets/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/fiat-wallets/lookup?email=user@example.com"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/yourself/i);
  });

  it("returns user info on success", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-2", name: "Alice", email: "alice@example.com" } as never);

    const { GET } = await import("@/app/api/fiat-wallets/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/fiat-wallets/lookup?email=alice@example.com"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Alice");
    expect(json.email).toBe("alice@example.com");
  });
});

// ── POST /api/fiat-wallets/convert ─────────────────────────────────────────

describe("POST /api/fiat-wallets/convert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "KES", amount: 100 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for unsupported target currency", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "FAKE", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/unsupported/i);
  });

  it("returns 404 when source wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "KES", amount: 100 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when source and target currency are the same", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500),
    } as never);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "USD", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/same/i);
  });

  it("returns 400 for insufficient balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(5),
    } as never);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "KES", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("converts successfully and returns received amount", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatWallet.findUnique).mockResolvedValue({
      id: "fw1", userId: "user-1", currency: "USD", balance: new Prisma.Decimal(500),
    } as never);
    vi.mocked(prisma.fiatWallet.findFirst).mockResolvedValue({
      id: "fw2", userId: "user-1", currency: "KES", balance: new Prisma.Decimal(0),
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/fiat-wallets/convert/route");
    const res = await POST(makeReq("http://localhost/api/fiat-wallets/convert", { fromWalletId: "fw1", targetCurrency: "KES", amount: 100 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.received).toBeGreaterThan(0);
    expect(json.targetCurrency).toBe("KES");
  });
});
