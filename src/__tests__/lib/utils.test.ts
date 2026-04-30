import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  maskCardNumber,
  generateCardNumber,
  generateCVV,
  generateWalletAddress,
  truncateAddress,
  getTransactionColor,
  getStatusColor,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats crypto currencies with $ prefix", () => {
    expect(formatCurrency(100, "USDC")).toBe("$100.00");
    expect(formatCurrency(1234.5, "USDT")).toBe("$1,234.50");
    expect(formatCurrency(0.99, "DAI")).toBe("$0.99");
    expect(formatCurrency(50, "ETH")).toBe("$50.00");
    expect(formatCurrency(50, "BTC")).toBe("$50.00");
    expect(formatCurrency(50, "BNB")).toBe("$50.00");
  });

  it("formats fiat currencies with Intl.NumberFormat", () => {
    expect(formatCurrency(100, "USD")).toBe("$100.00");
    expect(formatCurrency(100, "EUR")).toMatch(/100/);
  });

  it("defaults to USD for unknown currency", () => {
    expect(formatCurrency(50)).toBe("$50.00");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it("accepts a Date object", () => {
    const result = formatDate(new Date("2024-06-01"));
    expect(result).toMatch(/Jun/);
  });
});

describe("formatDateTime", () => {
  it("includes time in output", () => {
    const result = formatDateTime("2024-01-15T14:30:00");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("maskCardNumber", () => {
  it("masks all but last 4 digits", () => {
    expect(maskCardNumber("1234567890123456")).toBe("•••• •••• •••• 3456");
  });

  it("works with different last 4 digits", () => {
    expect(maskCardNumber("9999000011112222")).toBe("•••• •••• •••• 2222");
  });
});

describe("generateCardNumber", () => {
  it("generates a 16-digit string", () => {
    const num = generateCardNumber();
    expect(num).toMatch(/^\d{16}$/);
  });

  it("generates unique numbers", () => {
    const nums = new Set(Array.from({ length: 100 }, generateCardNumber));
    expect(nums.size).toBeGreaterThan(90);
  });
});

describe("generateCVV", () => {
  it("generates a 3-digit string", () => {
    const cvv = generateCVV();
    expect(cvv).toMatch(/^\d{3}$/);
  });

  it("is between 100 and 999", () => {
    for (let i = 0; i < 20; i++) {
      const n = parseInt(generateCVV(), 10);
      expect(n).toBeGreaterThanOrEqual(100);
      expect(n).toBeLessThanOrEqual(999);
    }
  });
});

describe("generateWalletAddress", () => {
  it("starts with 0x", () => {
    expect(generateWalletAddress()).toMatch(/^0x/);
  });

  it("is 42 chars long (0x + 40 hex)", () => {
    expect(generateWalletAddress()).toHaveLength(42);
  });

  it("contains only hex characters after 0x", () => {
    const addr = generateWalletAddress();
    expect(addr.slice(2)).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("truncateAddress", () => {
  it("shortens a wallet address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x1234...5678");
  });
});

describe("getTransactionColor", () => {
  it("returns correct colors for known types", () => {
    expect(getTransactionColor("DEPOSIT")).toBe("text-emerald-500");
    expect(getTransactionColor("CARD_PAYMENT")).toBe("text-red-400");
    expect(getTransactionColor("WITHDRAWAL")).toBe("text-orange-400");
    expect(getTransactionColor("TRANSFER")).toBe("text-blue-400");
    expect(getTransactionColor("CONVERSION")).toBe("text-violet-400");
  });

  it("returns gray for unknown type", () => {
    expect(getTransactionColor("UNKNOWN")).toBe("text-gray-400");
  });
});

describe("getStatusColor", () => {
  it("returns emerald for positive statuses", () => {
    expect(getStatusColor("COMPLETED")).toContain("emerald");
    expect(getStatusColor("ACTIVE")).toContain("emerald");
    expect(getStatusColor("VERIFIED")).toContain("emerald");
  });

  it("returns yellow for pending statuses", () => {
    expect(getStatusColor("PENDING")).toContain("yellow");
    expect(getStatusColor("SUBMITTED")).toContain("yellow");
  });

  it("returns red for failure statuses", () => {
    expect(getStatusColor("FAILED")).toContain("red");
    expect(getStatusColor("REJECTED")).toContain("red");
    expect(getStatusColor("TERMINATED")).toContain("red");
  });

  it("returns blue for frozen", () => {
    expect(getStatusColor("FROZEN")).toContain("blue");
  });

  it("returns gray for unknown", () => {
    expect(getStatusColor("WHATEVER")).toContain("gray");
  });
});
