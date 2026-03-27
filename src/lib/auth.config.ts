import type { NextAuthConfig } from "next-auth";

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
      }
      return token;
    },
    async session({ session, token, user }) {
      // For JWT strategy (credentials)
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
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
