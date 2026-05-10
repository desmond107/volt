import { describe, it, expect, vi, beforeEach } from "vitest";

describe("GET /api/wallet/rates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns rates, names and source", async () => {
    const { GET } = await import("@/app/api/wallet/rates/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rates).toBeDefined();
    expect(json.names).toBeDefined();
    expect(["live", "cached", "fallback"]).toContain(json.source);
  });

  it("includes USD in the rates object", async () => {
    const { GET } = await import("@/app/api/wallet/rates/route");
    const res = await GET();
    const json = await res.json();
    expect(json.rates.USD).toBeDefined();
    expect(typeof json.rates.USD).toBe("number");
  });

  it("includes currency names", async () => {
    const { GET } = await import("@/app/api/wallet/rates/route");
    const res = await GET();
    const json = await res.json();
    expect(json.names.USD).toBe("US Dollar");
    expect(json.names.EUR).toBe("Euro");
  });
});
