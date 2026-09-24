import { PrismaClient } from "@prisma/client";

type SelectShape = Record<string, unknown> | null | undefined;

function isDeleted(result: unknown): boolean {
  return Boolean((result as { deletedAt?: Date | null } | null)?.deletedAt);
}

/**
 * `findUnique` can't take a non-unique `deletedAt` filter in its `where`, so the
 * guard has to run on the result. If the caller used a `select` that omits
 * `deletedAt` we temporarily add it and strip it back out, so the returned shape
 * is exactly what the caller asked for.
 */
function addDeletedAtToSelect(select: SelectShape): {
  select: Record<string, unknown> | undefined;
  injected: boolean;
} {
  if (!select || "deletedAt" in select) {
    return { select: select ?? undefined, injected: false };
  }
  return { select: { ...select, deletedAt: true }, injected: true };
}

function stripInjectedField<T>(result: T, injected: boolean): T {
  if (!injected || !result || typeof result !== "object") return result;
  const rest = { ...(result as Record<string, unknown>) };
  delete rest.deletedAt;
  return rest as T;
}

/**
 * Soft-delete guard: every read path for `user` excludes rows with `deletedAt`
 * set by default. Callers that genuinely need deleted users (the purge job,
 * admin restore) opt back in by passing `deletedAt` explicitly in `where`.
 */
function createPrismaClient() {
  return new PrismaClient().$extends({
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
        async findUnique({ args, query }) {
          if (args.where?.deletedAt !== undefined) return query(args);
          const { select, injected } = addDeletedAtToSelect(
            args.select as SelectShape,
          );
          const result = await query(
            injected
              ? ({ ...args, select } as typeof args)
              : args,
          );
          if (isDeleted(result)) return null;
          return stripInjectedField(result, injected);
        },
        async findUniqueOrThrow({ args, query }) {
          if (args.where?.deletedAt !== undefined) return query(args);
          const { select, injected } = addDeletedAtToSelect(
            args.select as SelectShape,
          );
          const result = await query(
            injected
              ? ({ ...args, select } as typeof args)
              : args,
          );
          if (isDeleted(result)) throw new Error("No User found");
          return stripInjectedField(result, injected);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

// Reuse the client across hot reloads. Previously this global was assigned but
// never read, so every HMR cycle opened a fresh connection pool and exhausted
// the Neon connection limit during normal development.
export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
