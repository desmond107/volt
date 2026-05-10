import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1, emailVerifiedAt: null };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    fiatTransaction: { findMany: vi.fn(), count: vi.fn() },
  },
}));

function makeReq(query = "") {
  return new NextRequest(`http://localhost/api/fiat-transactions${query}`);
}

describe("GET /api/fiat-transactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/fiat-transactions/route");
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns paginated transactions with totals", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatTransaction.findMany).mockResolvedValue([
      { id: "t1", type: "DEPOSIT", amount: 100, currency: "USD", wallet: { name: "USD Wallet", currency: "USD" } },
    ] as never);
    vi.mocked(prisma.fiatTransaction.count).mockResolvedValue(1);

    const { GET } = await import("@/app/api/fiat-transactions/route");
    const res = await GET(makeReq("?page=1&limit=20"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactions).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.pages).toBe(1);
  });

  it("applies type filter when provided", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatTransaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fiatTransaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/fiat-transactions/route");
    await GET(makeReq("?type=DEPOSIT"));

    expect(prisma.fiatTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "DEPOSIT" }) })
    );
  });

  it("applies walletId filter when provided", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatTransaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fiatTransaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/fiat-transactions/route");
    await GET(makeReq("?walletId=fw1"));

    expect(prisma.fiatTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ walletId: "fw1" }) })
    );
  });

  it("clamps page to minimum 1", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.fiatTransaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fiatTransaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/fiat-transactions/route");
    const res = await GET(makeReq("?page=-5"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.page).toBe(1);
  });
});
