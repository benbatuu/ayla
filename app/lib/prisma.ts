import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";

/** Bump after `prisma generate` when schema changes to refresh the dev singleton. */
const DEV_CLIENT_TOKEN = "20260825-neon-postgres";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientToken: string | undefined;
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

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
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
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientToken = DEV_CLIENT_TOKEN;
  return client;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV === "production" && !globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
