"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [fetchError, setFetchError] = useState("");

  // Derived, not stored: the missing-token message is a pure function of the
  // URL, so setting it from an effect only caused an extra render pass.
  const errorMessage = token
    ? fetchError
    : "No verification token provided.";

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Verification failed");
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setFetchError(err.message || "Verification failed");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl"><h1>Email Verification</h1></CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email address..."}
          {status === "success" && "Your email has been verified!"}
          {status === "error" && "Verification failed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        )}
        {status === "success" && (
          <>
            <CheckCircle className="size-12 text-green-500" />
            <p className="text-sm text-muted-foreground text-center">
              You can now sign in to your account.
            </p>
            <Button render={<Link href="/login" />}>Go to Login</Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="size-12 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              {errorMessage || "Invalid or expired verification link."}
            </p>
            <Button variant="outline" render={<Link href="/login" />}>
              Back to Login
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex w-full items-center justify-center px-4">
      <Suspense fallback={null}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
