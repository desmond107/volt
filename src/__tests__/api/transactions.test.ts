import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: { findMany: vi.fn(), count: vi.fn() },
  },
}));

function makeReq(query = "") {
  return new NextRequest(`http://localhost/api/transactions${query}`);
}

describe("GET /api/transactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/transactions/route");
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns paginated transactions", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { id: "tx1", type: "DEPOSIT", amount: 100 },
      { id: "tx2", type: "CARD_PAYMENT", amount: 25 },
    ] as never);
    vi.mocked(prisma.transaction.count).mockResolvedValue(2);

    const { GET } = await import("@/app/api/transactions/route");
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactions).toHaveLength(2);
    expect(json.total).toBe(2);
    expect(json.page).toBe(1);
    expect(json.pages).toBe(1);
  });

  it("filters by type", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/transactions/route");
    await GET(makeReq("?type=DEPOSIT"));

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "DEPOSIT" }) })
    );
  });

  it("does not filter when type is ALL", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/transactions/route");
    await GET(makeReq("?type=ALL"));

    const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0];
    expect(callArgs.where).not.toHaveProperty("type");
  });

  it("handles invalid page param gracefully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);

    const { GET } = await import("@/app/api/transactions/route");
    const res = await GET(makeReq("?page=abc&limit=xyz"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.page).toBe(1);
  });

  it("respects custom page and limit", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.transaction.count).mockResolvedValue(50);

    const { GET } = await import("@/app/api/transactions/route");
    await GET(makeReq("?page=3&limit=10"));

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});
