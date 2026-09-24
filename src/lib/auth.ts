import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { authenticateCredentials } from "./auth/credentials";
import { clientIp } from "./rate-limit";

const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
    ? [
        Facebook({
          clientId: process.env.AUTH_FACEBOOK_ID,
          clientSecret: process.env.AUTH_FACEBOOK_SECRET,
        }),
      ]
    : []),
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      portal: { label: "Portal", type: "text" },
    },
    async authorize(credentials, request) {
      return authenticateCredentials(credentials, clientIp(request));
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
  },
  logger: {
    error(error) {
      if (error instanceof CredentialsSignin) {
        if (process.env.NODE_ENV === "development") {
          console.info("[auth] Credential sign-in rejected.");
        }
        return;
      }
      console.error(error);
    },
  },
  providers,
});
