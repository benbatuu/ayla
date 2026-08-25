import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

/** Bump after `prisma generate` when schema changes to refresh the dev singleton. */
const DEV_CLIENT_TOKEN = "20260825-neon-adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientToken: string | undefined;
  pgPool: Pool | undefined;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (url.startsWith("file:")) {
    const filePath = url.replace(/^file:/, "");
    if (path.isAbsolute(filePath)) {
      return `file:${filePath}`;
    }
    return `file:${path.join(
      process.cwd(),
      "prisma",
      filePath.replace(/^\.\//, "")
    )}`;
  }

  return url;
}

export function createPrismaClient() {
  const connectionString = getDatabaseUrl();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    return globalForPrisma.prisma ?? createPrismaClient();
  }

  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaClientToken === DEV_CLIENT_TOKEN
  ) {
    return globalForPrisma.prisma;
  }

  void globalForPrisma.prisma?.$disconnect();
  void globalForPrisma.pgPool?.end();
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientToken = DEV_CLIENT_TOKEN;
  return client;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV === "production" && !globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
