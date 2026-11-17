import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env / .dev.vars or as a Worker secret.");
  }

  // Cloudflare Workers cannot run Prisma's native query engine. We use Neon's
  // HTTP driver (rather than the WebSocket pool) because Workers reuse isolates
  // across requests and WebSocket I/O objects are bound to the request that
  // created them. HTTP mode is stateless and safe across requests.
  const adapter = new PrismaNeonHTTP(connectionString, {});

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
