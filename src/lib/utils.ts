import { clsx, type ClassValue } from "clsx";
import { Prisma } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Recursively convert Prisma.Decimal to number so NextResponse.json() emits
// numeric values instead of strings (Decimal.toJSON() returns a string).
export function serializeDecimals<T>(obj: T): T {
  if (obj instanceof Prisma.Decimal) return obj.toNumber() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      out[key] = serializeDecimals((obj as Record<string, unknown>)[key]);
    }
    return out as T;
  }
  return obj;
}

const CRYPTO_CURRENCIES = new Set(["USDC", "USDT", "DAI", "ETH", "BTC", "BNB"]);

export function formatCurrency(amount: number, currency = "USD") {
  if (CRYPTO_CURRENCIES.has(currency)) {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function maskCardNumber(cardNumber: string) {
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
}

export function generateCardNumber() {
  const groups = Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  return groups.join("");
}

export function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function generateWalletAddress() {
  const chars = "0123456789abcdef";
  return "0x" + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getTransactionColor(type: string) {
  switch (type) {
    case "DEPOSIT": return "text-emerald-500";
    case "CARD_PAYMENT": return "text-red-400";
    case "WITHDRAWAL": return "text-orange-400";
    case "TRANSFER": return "text-blue-400";
    case "CONVERSION": return "text-violet-400";
    default: return "text-gray-400";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED": case "ACTIVE": case "VERIFIED": return "text-emerald-500 bg-emerald-500/10";
    case "PENDING": case "SUBMITTED": return "text-yellow-500 bg-yellow-500/10";
    case "FAILED": case "REJECTED": case "TERMINATED": return "text-red-500 bg-red-500/10";
    case "FROZEN": return "text-blue-400 bg-blue-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}
