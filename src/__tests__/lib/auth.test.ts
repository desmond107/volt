import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    wallet: {
      createMany: vi.fn(),
    },
  },
}));

describe("hashPassword", () => {
  it("returns a bcrypt hash", async () => {
    const hash = await hashPassword("password123");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("produces different hashes for the same input", async () => {
    const h1 = await hashPassword("samepassword");
    const h2 = await hashPassword("samepassword");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("mypassword");
    expect(await verifyPassword("mypassword", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("mypassword");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("returns false for empty password", async () => {
    const hash = await hashPassword("mypassword");
    expect(await verifyPassword("", hash)).toBe(false);
  });
});

describe("getUserByEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma with lowercased email", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockUser = { id: "1", email: "test@example.com" };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const { getUserByEmail } = await import("@/lib/auth");
    const result = await getUserByEmail("test@example.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(result).toEqual(mockUser);
  });

  it("returns null when user not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { getUserByEmail } = await import("@/lib/auth");
    const result = await getUserByEmail("notfound@example.com");
    expect(result).toBeNull();
  });
});

describe("createUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates user and seeds 3 wallets", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockUser = { id: "user-1", email: "new@example.com", name: "New User" };
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.wallet.createMany).mockResolvedValue({ count: 3 });

    const { createUser } = await import("@/lib/auth");
    const result = await createUser("new@example.com", "New User", "password123");

    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(prisma.wallet.createMany).toHaveBeenCalledOnce();

    const walletCall = vi.mocked(prisma.wallet.createMany).mock.calls[0][0];
    expect(walletCall.data).toHaveLength(3);
    const assets = walletCall.data.map((w: { asset: string }) => w.asset);
    expect(assets).toContain("USDC");
    expect(assets).toContain("USDT");
    expect(assets).toContain("DAI");
    expect(result).toEqual(mockUser);
  });
});
