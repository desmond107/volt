import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function makeReq(body: object) {
  return new NextRequest("http://localhost/api/wallet/send", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/wallet/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0x123", amount: 10 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing or invalid parameters", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", amount: 10 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for zero amount", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xabc", amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when source wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "w2", userId: "user-2", address: "0xrecipient" } as never);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xrecipient", amount: 10 }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when recipient wallet not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: 500 } as never)
      .mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xunknown", amount: 10 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when sending to own wallet", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: 500 } as never)
      .mockResolvedValueOnce({
        id: "w2", userId: "user-1", address: "0xself",
        user: { id: "user-1", name: "Test User", email: "user@example.com" },
      } as never);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xself", amount: 10 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/own wallet/i);
  });

  it("returns 400 for insufficient balance", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: new Prisma.Decimal(5) } as never)
      .mockResolvedValueOnce({
        id: "w2", userId: "user-2", address: "0xrecipient",
        user: { id: "user-2", name: "Alice", email: "alice@example.com" },
      } as never);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xrecipient", amount: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/insufficient/i);
  });

  it("sends funds successfully and creates two transaction records", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique)
      .mockResolvedValueOnce({ id: "w1", userId: "user-1", asset: "USDC", balance: new Prisma.Decimal(500) } as never)
      .mockResolvedValueOnce({
        id: "w2", userId: "user-2", address: "0xrecipient", asset: "USDC",
        user: { id: "user-2", name: "Alice", email: "alice@example.com" },
      } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const { POST } = await import("@/app/api/wallet/send/route");
    const res = await POST(makeReq({ fromWalletId: "w1", toAddress: "0xrecipient", amount: 50 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.recipientName).toBe("Alice");

    const fn = vi.mocked(prisma.$transaction).mock.calls[0][0];
    expect(typeof fn).toBe("function");
  });
});

// ── GET /api/wallet/lookup ─────────────────────────────────────────────────

describe("GET /api/wallet/lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/wallet/lookup?q=alice@example.com&asset=USDC"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when query or asset is missing", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/wallet/lookup?q=alice@example.com"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when recipient not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue(null);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/wallet/lookup?q=nobody@example.com&asset=USDC"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when recipient is the current user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue({
      id: "w1", address: "0xself", asset: "USDC", network: "Base",
      user: { id: "user-1", name: "Test User", email: "user@example.com" },
    } as never);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/wallet/lookup?q=user@example.com&asset=USDC"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/own wallet/i);
  });

  it("returns recipient info when found by email", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue({
      id: "w2", address: "0xalice", asset: "USDC", network: "Base",
      user: { id: "user-2", name: "Alice", email: "alice@example.com" },
    } as never);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const res = await GET(new NextRequest("http://localhost/api/wallet/lookup?q=alice@example.com&asset=USDC"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Alice");
    expect(json.address).toBe("0xalice");
  });

  it("uses findUnique for 0x address lookup", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w2", address: "0x" + "a".repeat(40), asset: "USDC", network: "Base",
      user: { id: "user-2", name: "Alice", email: "alice@example.com" },
    } as never);

    const { GET } = await import("@/app/api/wallet/lookup/route");
    const addr = "0x" + "a".repeat(40);
    await GET(new NextRequest(`http://localhost/api/wallet/lookup?q=${addr}&asset=USDC`));
    expect(prisma.wallet.findUnique).toHaveBeenCalled();
    expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
  });
});
