import { PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient();

// Soft-delete extension: auto-filter deleted users from findMany/findFirst/count
export const prisma = basePrisma.$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: args.where?.deletedAt ?? null };
        return query(args);
      },
    },
  },
});

const globalForPrisma = globalThis as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
