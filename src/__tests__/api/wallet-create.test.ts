import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1, emailVerifiedAt: null };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/crossmint", () => ({
  createCrossmintWallet: vi.fn(),
}));
vi.mock("@/lib/moralis-streams", () => ({
  getOrCreateStream: vi.fn(),
  watchAddress: vi.fn(),
}));

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/wallet", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── POST /api/wallet ────────────────────────────────────────────────────────

describe("POST /api/wallet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/wallet/route");
    const res = await POST(makeRequest({ asset: "USDC", network: "Base" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for unsupported asset", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/route");
    const res = await POST(makeRequest({ asset: "BTC", network: "Base" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid asset/i);
  });

  it("returns 400 when network is not supported for the asset", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/wallet/route");
    // DAI is only on Base, not BNB Smart Chain
    const res = await POST(makeRequest({ asset: "DAI", network: "BNB Smart Chain" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/not available/i);
  });

  it("returns 409 when wallet already exists for that asset+network", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue({ id: "w1" } as never);

    const { POST } = await import("@/app/api/wallet/route");
    const res = await POST(makeRequest({ asset: "USDC", network: "Base" }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already have/i);
  });

  it("returns 201 and created wallet on success", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    const { createCrossmintWallet } = await import("@/lib/crossmint");
    const { getOrCreateStream, watchAddress } = await import("@/lib/moralis-streams");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    vi.mocked(createCrossmintWallet).mockResolvedValue({ walletId: "cw-1", address: "0xabc123" } as never);
    vi.mocked(getOrCreateStream).mockResolvedValue("stream-1");
    vi.mocked(watchAddress).mockResolvedValue(undefined);
    vi.mocked(prisma.wallet.create).mockResolvedValue({
      id: "w-new", asset: "USDC", network: "Base", address: "0xabc123", balance: new Prisma.Decimal(0),
    } as never);

    const { POST } = await import("@/app/api/wallet/route");
    const res = await POST(makeRequest({ asset: "USDC", network: "Base" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.wallet.asset).toBe("USDC");
    expect(json.wallet.network).toBe("Base");
  });

  it("returns 500 when wallet creation service fails", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    const { createCrossmintWallet } = await import("@/lib/crossmint");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    vi.mocked(createCrossmintWallet).mockRejectedValue(new Error("Service unavailable"));

    const { POST } = await import("@/app/api/wallet/route");
    const res = await POST(makeRequest({ asset: "USDT", network: "BNB Smart Chain" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/service unavailable/i);
  });
});

// ── DELETE /api/wallet/[id] ─────────────────────────────────────────────────

describe("DELETE /api/wallet/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeDeleteReq(id: string) {
    return new NextRequest(`http://localhost/api/wallet/${id}`, { method: "DELETE" });
  }

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/wallet/[id]/route");
    const res = await DELETE(makeDeleteReq("w1"), { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when wallet does not exist", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/wallet/[id]/route");
    const res = await DELETE(makeDeleteReq("w1"), { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when wallet belongs to another user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "other-user", balance: new Prisma.Decimal(0),
    } as never);

    const { DELETE } = await import("@/app/api/wallet/[id]/route");
    const res = await DELETE(makeDeleteReq("w1"), { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when wallet still has funds", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "user-1", balance: new Prisma.Decimal(50),
    } as never);

    const { DELETE } = await import("@/app/api/wallet/[id]/route");
    const res = await DELETE(makeDeleteReq("w1"), { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/funds/i);
  });

  it("deletes wallet successfully when balance is zero", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "user-1", balance: new Prisma.Decimal(0),
    } as never);
    vi.mocked(prisma.wallet.delete).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/wallet/[id]/route");
    const res = await DELETE(makeDeleteReq("w1"), { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(prisma.wallet.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
  });
});
