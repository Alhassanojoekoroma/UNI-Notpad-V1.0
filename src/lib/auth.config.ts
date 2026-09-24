import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Re-validate user against DB every 5 minutes to catch deletions/suspensions
const SESSION_REVALIDATE_MS = 5 * 60 * 1000;

export const authConfig: NextAuthConfig = {
  basePath: "/api/auth",
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = ["/", "/login", "/register", "/setup"].includes(
        nextUrl.pathname,
      );
      if (isPublicPage) return true;
      if (!isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.facultyId = user.facultyId;
        token.semester = user.semester;
        token.programId = user.programId;
        token.studentId = user.studentId;
        token.issuedAt = Date.now();
        token.lastVerified = Date.now();
      }

      // Periodically re-check the user is still active in the DB.
      const lastVerified = (token.lastVerified as number) ?? 0;
      if (Date.now() - lastVerified > SESSION_REVALIDATE_MS) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: {
            deletedAt: true,
            isSuspended: true,
            isActive: true,
            passwordChangedAt: true,
            role: true,
            facultyId: true,
            semester: true,
            programId: true,
            studentId: true,
          },
        });

        if (
          !dbUser ||
          dbUser.deletedAt ||
          dbUser.isSuspended ||
          !dbUser.isActive
        ) {
          return { ...token, invalidated: true };
        }

        // Reject tokens minted before the last password change, so a reset
        // actually terminates an attacker's existing session.
        const issuedAt = (token.issuedAt as number) ?? 0;
        if (
          dbUser.passwordChangedAt &&
          dbUser.passwordChangedAt.getTime() > issuedAt
        ) {
          return { ...token, invalidated: true };
        }

        // Refresh role/faculty data in case an admin changed it.
        token.role = dbUser.role;
        token.facultyId = dbUser.facultyId;
        token.semester = dbUser.semester;
        token.programId = dbUser.programId;
        token.studentId = dbUser.studentId;
        token.lastVerified = Date.now();
      }

      return token;
    },
    async session({ session, token, user }) {
      // An invalidated token (deleted, suspended, or password changed) must not
      // produce a usable session. Previously `id` was set to "" and everything
      // downstream still saw a truthy `session.user`, so guards written as
      // `if (!session?.user)` let the request through with an empty user id.
      if (token?.invalidated) {
        return {
          ...session,
          user: undefined as unknown as typeof session.user,
          expires: new Date(0).toISOString() as typeof session.expires,
        };
      }

      // JWT strategy (credentials)
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.facultyId = token.facultyId as string | null;
        session.user.semester = token.semester as number | null;
        session.user.programId = token.programId as string | null;
        session.user.studentId = token.studentId as string | null;
      }

      // DB strategy (OAuth)
      if (user) {
        session.user.role = user.role;
        session.user.facultyId = user.facultyId;
        session.user.semester = user.semester;
        session.user.programId = user.programId;
        session.user.studentId = user.studentId;
      }

      return session;
    },
  },
  providers: [], // filled in auth.ts
};
