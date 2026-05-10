import { describe, it, expect } from "vitest";
import { convertAmount, FALLBACK_RATES } from "@/lib/rates";

describe("convertAmount", () => {
  const rates = FALLBACK_RATES;

  it("returns same amount when converting USD to USD", () => {
    expect(convertAmount(100, "USD", "USD", rates)).toBe(100);
  });

  it("converts USD to KES correctly", () => {
    const result = convertAmount(1, "USD", "KES", rates);
    expect(result).toBeCloseTo(rates.KES, 4);
  });

  it("converts KES to USD correctly", () => {
    const result = convertAmount(rates.KES, "KES", "USD", rates);
    expect(result).toBeCloseTo(1, 4);
  });

  it("converts EUR to GBP correctly", () => {
    const expected = (100 / rates.EUR) * rates.GBP;
    expect(convertAmount(100, "EUR", "GBP", rates)).toBeCloseTo(expected, 4);
  });

  it("defaults unknown from-currency rate to 1", () => {
    const result = convertAmount(100, "UNKNOWN", "USD", rates);
    expect(result).toBeCloseTo(100, 4);
  });

  it("defaults unknown to-currency rate to 1", () => {
    const result = convertAmount(100, "USD", "UNKNOWN", rates);
    expect(result).toBeCloseTo(100, 4);
  });

  it("handles zero amount", () => {
    expect(convertAmount(0, "USD", "KES", rates)).toBe(0);
  });
});
