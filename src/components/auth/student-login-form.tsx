"use client";

import { useState } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

/** Official Google "G" logo SVG */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M47.53 24.56c0-1.64-.15-3.22-.42-4.74H24v8.97h13.19c-.57 3.09-2.3 5.71-4.9 7.47v6.2h7.93c4.64-4.28 7.31-10.6 7.31-17.9z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.64 0 12.21-2.2 16.28-5.97l-7.93-6.2c-2.2 1.47-5.01 2.34-8.35 2.34-6.42 0-11.86-4.33-13.8-10.15H2.01v6.4C6.07 42.89 14.42 48 24 48z"
      />
      <path
        fill="#FBBC05"
        d="M10.2 28.02A14.37 14.37 0 0 1 9.6 24c0-1.39.24-2.74.6-4.02V13.58H2.01A23.95 23.95 0 0 0 0 24c0 3.87.93 7.53 2.01 10.42l8.19-6.4z"
      />
      <path
        fill="#EA4335"
        d="M24 9.56c3.62 0 6.87 1.25 9.43 3.68l7.07-7.07C36.2 2.2 30.63 0 24 0 14.42 0 6.07 5.11 2.01 13.58l8.19 6.4C12.14 13.89 17.58 9.56 24 9.56z"
      />
    </svg>
  );
}

/** Facebook "f" logo SVG */
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M32 16C32 7.163 24.837 0 16 0S0 7.163 0 16c0 7.986 5.851 14.604 13.5 15.806V20.625H9.438V16H13.5v-3.547c0-4.01 2.389-6.226 6.043-6.226 1.75 0 3.582.313 3.582.313v3.938H21.1c-1.989 0-2.6 1.234-2.6 2.5V16h4.438l-.71 4.625H18.5v11.181C26.149 30.604 32 23.986 32 16z"
      />
      <path
        fill="#fff"
        d="M22.228 20.625 22.938 16H18.5v-2.922c0-1.266.611-2.5 2.6-2.5h2.026V6.64s-1.832-.313-3.582-.313c-3.654 0-6.043 2.215-6.043 6.226V16H9.438v4.625H13.5v11.181a16.16 16.16 0 0 0 5 0V20.625h3.728z"
      />
    </svg>
  );
}

export function StudentLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      const session = await getSession();
      if (session?.user?.role !== "STUDENT") {
        await signOut({ redirect: false });
        setError(
          "This account isn't a student account — use the admin or lecturer portal."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setOauthLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setOauthLoading(null);
    }
  }

  const busy = isLoading || oauthLoading !== null;

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center pb-2">
        {/* Logo mark */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5e41e4]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to UniNotepad</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* OAuth buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 font-medium"
            onClick={() => handleOAuth("google")}
            disabled={busy}
            id="btn-sign-in-google"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 font-medium"
            onClick={() => handleOAuth("facebook")}
            disabled={busy}
            id="btn-sign-in-facebook"
          >
            {oauthLoading === "facebook" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FacebookIcon />
            )}
            Facebook
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or sign in with email
          </span>
        </div>

        {/* Credentials form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#5e41e4] hover:opacity-90"
            disabled={busy}
            id="btn-sign-in-email"
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pt-0">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[#5e41e4] hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
