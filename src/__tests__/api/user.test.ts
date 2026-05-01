import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "VERIFIED", kycLevel: 1 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

function makeReq(body: object) {
  return new NextRequest("http://localhost/api/user", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/user ──────────────────────────────────────────────────────────

describe("GET /api/user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/user/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user profile", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1", email: "user@example.com", name: "Test User",
      kycStatus: "VERIFIED", kycLevel: 1, createdAt: new Date(),
    } as never);

    const { GET } = await import("@/app/api/user/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("user@example.com");
  });
});

// ── PATCH /api/user ────────────────────────────────────────────────────────

describe("PATCH /api/user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makeReq({ name: "New Name" }));
    expect(res.status).toBe(401);
  });

  it("updates name successfully", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makeReq({ name: "New Name" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: "New Name" } })
    );
  });

  it("returns 400 when nothing to update", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for incorrect current password when changing password", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    const { verifyPassword } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", passwordHash: "hash" } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makeReq({ currentPassword: "wrong", newPassword: "newpass123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/incorrect/i);
  });

  it("updates password when current password is correct", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    const { verifyPassword, hashPassword } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1", passwordHash: "hash" } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue("newhash");
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { PATCH } = await import("@/app/api/user/route");
    const res = await PATCH(makeReq({ currentPassword: "correct", newPassword: "newpass123" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordHash: "newhash" } })
    );
  });
});
