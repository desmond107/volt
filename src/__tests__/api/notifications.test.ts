import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1, emailVerifiedAt: null };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

function makePatchReq(body: object) {
  return new NextRequest("http://localhost/api/notifications", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/notifications ─────────────────────────────────────────────────

describe("GET /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns notifications for authenticated user", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { id: "n1", type: "DEPOSIT", title: "Deposit received", body: "+$100", read: false },
      { id: "n2", type: "SEND", title: "Transfer sent", body: "-$50", read: true },
    ] as never);

    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.notifications).toHaveLength(2);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" }, take: 30 })
    );
  });
});

// ── PATCH /api/notifications ───────────────────────────────────────────────

describe("PATCH /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notifications/route");
    const res = await PATCH(makePatchReq({ markAllRead: true }));
    expect(res.status).toBe(401);
  });

  it("marks all notifications as read", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 });

    const { PATCH } = await import("@/app/api/notifications/route");
    const res = await PATCH(makePatchReq({ markAllRead: true }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", read: false }, data: { read: true } })
    );
  });

  it("marks a single notification as read by id", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.notification.update).mockResolvedValue({} as never);

    const { PATCH } = await import("@/app/api/notifications/route");
    const res = await PATCH(makePatchReq({ id: "n1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "n1", userId: "user-1" }, data: { read: true } })
    );
  });

  it("returns 400 when neither id nor markAllRead is provided", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { PATCH } = await import("@/app/api/notifications/route");
    const res = await PATCH(makePatchReq({}));
    expect(res.status).toBe(400);
  });
});
