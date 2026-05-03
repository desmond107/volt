import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url: dbUrl, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
