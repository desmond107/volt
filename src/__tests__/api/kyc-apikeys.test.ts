import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = { id: "user-1", email: "user@example.com", name: "Test User", kycStatus: "PENDING", kycLevel: 0 };

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    kycDocument: { findMany: vi.fn(), create: vi.fn() },
    apiKey: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function makeReq(body: object, url = "http://localhost/api") {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/kyc ───────────────────────────────────────────────────────────

describe("GET /api/kyc", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/kyc/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns documents and kycStatus", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.kycDocument.findMany).mockResolvedValue([{ id: "doc1" }] as never);

    const { GET } = await import("@/app/api/kyc/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documents).toHaveLength(1);
    expect(json.kycStatus).toBe("PENDING");
  });
});

// ── POST /api/kyc ──────────────────────────────────────────────────────────

describe("POST /api/kyc", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/kyc/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
  });

  it("returns 400 when docType or country is missing", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const { POST } = await import("@/app/api/kyc/route");
    const noCountry = await POST(makeReq({ docType: "passport" }));
    expect(noCountry.status).toBe(400);

    const noDocType = await POST(makeReq({ country: "Kenya" }));
    expect(noDocType.status).toBe(400);
  });

  it("submits KYC and auto-verifies", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);

    const { POST } = await import("@/app/api/kyc/route");
    const res = await POST(makeReq({ docType: "passport", country: "Kenya", docNumber: "A123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kycStatus).toBe("VERIFIED");
    expect(json.success).toBe(true);
  });
});

// ── GET /api/apikeys ───────────────────────────────────────────────────────

describe("GET /api/apikeys", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { GET } = await import("@/app/api/apikeys/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only active keys", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
      { id: "k1", key: "sk_live_abc", name: "Test Key" },
    ] as never);

    const { GET } = await import("@/app/api/apikeys/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.keys).toHaveLength(1);
    expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });
});

// ── POST /api/apikeys ──────────────────────────────────────────────────────

describe("POST /api/apikeys", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { POST } = await import("@/app/api/apikeys/route");
    const res = await POST(makeReq({ name: "My Key" }));
    expect(res.status).toBe(401);
  });

  it("generates a sk_live_ prefixed key", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }) => ({ id: "k1", ...data } as never));

    const { POST } = await import("@/app/api/apikeys/route");
    const res = await POST(makeReq({ name: "My Key", permissions: "read" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.apiKey.key).toMatch(/^sk_live_/);
    expect(json.apiKey.secretOnce).toBeDefined();
  });

  it("uses default name when name is not provided", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }) => ({ id: "k1", ...data } as never));

    const { POST } = await import("@/app/api/apikeys/route");
    await POST(makeReq({}));
    const createCall = vi.mocked(prisma.apiKey.create).mock.calls[0][0].data;
    expect(createCall.name).toBe("Default Key");
  });
});

// ── DELETE /api/apikeys ────────────────────────────────────────────────────

describe("DELETE /api/apikeys", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/apikeys/route");
    const res = await DELETE(makeReq({ id: "k1" }));
    expect(res.status).toBe(401);
  });

  it("revokes key by setting isActive to false", async () => {
    const { getSession } = await import("@/lib/session");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/apikeys/route");
    const res = await DELETE(makeReq({ id: "k1" }));
    expect(res.status).toBe(200);
    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: "k1", userId: "user-1" },
      data: { isActive: false },
    });
  });
});
