import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    wallet: { createMany: vi.fn() },
  },
}));

vi.mock("@/lib/session", () => ({
  setSession: vi.fn(),
  clearSession: vi.fn(),
  getSession: vi.fn(),
}));

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/auth", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── LOGIN ──────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when fields are missing", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required/i);
  });

  it("returns 401 for unknown email", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "no@one.com", password: "pass" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong password", async () => {
    const { prisma } = await import("@/lib/prisma");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct", 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1", email: "a@b.com", name: "A", passwordHash: hash,
      kycStatus: "PENDING", kycLevel: 0,
      failedLoginAttempts: 0, loginLockedUntil: null,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "a@b.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when account is locked", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1", email: "a@b.com", name: "A", passwordHash: "hash",
      kycStatus: "PENDING", kycLevel: 0,
      failedLoginAttempts: 5,
      loginLockedUntil: new Date(Date.now() + 10 * 60 * 1000),
    } as never);

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "a@b.com", password: "any" }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toMatch(/too many/i);
  });

  it("returns 200 and sets session on success", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { setSession } = await import("@/lib/session");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1", email: "user@example.com", name: "Test User",
      passwordHash: hash, kycStatus: "VERIFIED", kycLevel: 1,
      failedLoginAttempts: 0, loginLockedUntil: null,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "user@example.com", password: "password123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("user@example.com");
    expect(setSession).toHaveBeenCalledWith("user-1");
  });

  it("increments failedLoginAttempts on wrong password", async () => {
    const { prisma } = await import("@/lib/prisma");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct", 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1", email: "a@b.com", name: "A", passwordHash: hash,
      kycStatus: "PENDING", kycLevel: 0,
      failedLoginAttempts: 2, loginLockedUntil: null,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/auth/login/route");
    await POST(makeRequest({ email: "a@b.com", password: "wrong" }));

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginAttempts: 3 }) })
    );
  });

  it("locks account after 5 failed attempts", async () => {
    const { prisma } = await import("@/lib/prisma");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct", 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1", email: "a@b.com", name: "A", passwordHash: hash,
      kycStatus: "PENDING", kycLevel: 0,
      failedLoginAttempts: 4, loginLockedUntil: null,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeRequest({ email: "a@b.com", password: "wrong" }));
    expect(res.status).toBe(429);

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data).toHaveProperty("loginLockedUntil");
  });

  it("resets failedLoginAttempts on successful login", async () => {
    const { prisma } = await import("@/lib/prisma");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct", 12);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1", email: "a@b.com", name: "A", passwordHash: hash,
      kycStatus: "PENDING", kycLevel: 0,
      failedLoginAttempts: 3, loginLockedUntil: null,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/auth/login/route");
    await POST(makeRequest({ email: "a@b.com", password: "correct" }));

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { failedLoginAttempts: 0, loginLockedUntil: null } })
    );
  });

  it("normalizes email to lowercase", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");
    await POST(makeRequest({ email: "USER@EXAMPLE.COM", password: "pass" }));
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });
});

// ── SIGNUP ─────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when fields are missing", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const res = await POST(makeRequest({ email: "a@b.com", name: "A" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required/i);
  });

  it("returns 400 when password is too short", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const res = await POST(makeRequest({ email: "a@b.com", name: "A", password: "short" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/8 characters/i);
  });

  it("returns 409 when email already exists", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "1" } as never);

    const { POST } = await import("@/app/api/auth/signup/route");
    const res = await POST(makeRequest({ email: "exists@example.com", name: "A", password: "password123" }));
    expect(res.status).toBe(409);
  });

  it("returns 200 and creates user on success", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { setSession } = await import("@/lib/session");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-user", email: "new@example.com", name: "New User",
    } as never);
    vi.mocked(prisma.wallet.createMany).mockResolvedValue({ count: 3 });

    const { POST } = await import("@/app/api/auth/signup/route");
    const res = await POST(makeRequest({ email: "new@example.com", name: "New User", password: "password123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("new@example.com");
    expect(setSession).toHaveBeenCalledWith("new-user");
  });
});

// ── LOGOUT ─────────────────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("clears session and returns 200", async () => {
    const { clearSession } = await import("@/lib/session");
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);
    expect(clearSession).toHaveBeenCalledOnce();
  });
});
