import { PrismaClient } from "@prisma/client";

// Development rejimida hot-reload paytida bir nechta PrismaClient
// instansiyasi yaratilib ketmasligi uchun global obyektda saqlaymiz.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
