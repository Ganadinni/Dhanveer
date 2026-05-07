import { PrismaClient } from "@prisma/client";

/**
 * In development, attach PrismaClient to the global object to prevent
 * exhausting database connections during hot-reload cycles.
 * In production, create a fresh singleton per process.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
