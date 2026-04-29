import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: string, name: string, password: string) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  // Seed default wallets for new users
  await prisma.wallet.createMany({
    data: [
      { userId: user.id, asset: "USDC", network: "Base", address: genAddress(), balance: 0 },
      { userId: user.id, asset: "USDT", network: "BSC", address: genAddress(), balance: 0 },
      { userId: user.id, asset: "DAI", network: "Base", address: genAddress(), balance: 0 },
    ],
  });

  return user;
}

function genAddress() {
  const chars = "0123456789abcdef";
  return "0x" + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
