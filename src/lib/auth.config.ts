import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Re-validate user against DB every 5 minutes to catch deletions/suspensions
const SESSION_REVALIDATE_MS = 5 * 60 * 1000;

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = ["/", "/login", "/register", "/setup"].includes(
        nextUrl.pathname
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
        token.lastVerified = Date.now();
      }

      // Periodically re-check user is still active in DB
      const lastVerified = (token.lastVerified as number) ?? 0;
      if (Date.now() - lastVerified > SESSION_REVALIDATE_MS) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: {
            deletedAt: true,
            isSuspended: true,
            isActive: true,
            role: true,
            facultyId: true,
            semester: true,
            programId: true,
            studentId: true,
          },
        });
        if (!dbUser || dbUser.deletedAt || dbUser.isSuspended || !dbUser.isActive) {
          // Return empty token to force sign-out
          return { ...token, invalidated: true };
        }
        // Refresh role/faculty data in case admin changed it
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
      // If user was invalidated (deleted/suspended), return empty session
      if (token?.invalidated) {
        session.user.id = "";
        return session;
      }
      // For JWT strategy (credentials)
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.facultyId = token.facultyId as string;
        session.user.semester = token.semester as number;
        session.user.programId = token.programId as string;
        session.user.studentId = token.studentId as string;
      }
      // For DB strategy (OAuth)
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
