import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.CARD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("CARD_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptCardField(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: iv(12 bytes) || tag(16 bytes) || ciphertext — stored as hex
  return Buffer.concat([iv, tag, encrypted]).toString("hex");
}

export function decryptCardField(value: string): string {
  // Values shorter than 57 hex chars (28 bytes) are legacy plaintext — return as-is
  if (value.length < 57) return value;
  try {
    const key = getKey();
    const buf = Buffer.from(value, "hex");
    const iv  = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    // If decryption fails the value is plaintext (e.g. existing DB record)
    return value;
  }
}

/** Decrypt cardNumber and cvv fields on a card object in-place. */
export function decryptCard<T extends { cardNumber: string; cvv: string }>(card: T): T {
  return {
    ...card,
    cardNumber: decryptCardField(card.cardNumber),
    cvv: decryptCardField(card.cvv),
  };
}
