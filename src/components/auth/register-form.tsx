"use client";

import { useState, useEffect, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

type Faculty = { id: string; name: string; code: string };
type Program = { id: string; name: string; code: string; facultyId: string };

const TOTAL_STEPS = 3;

/**
 * Public student registration.
 *
 * There is deliberately no "Student or Lecturer?" step. Public sign-up creates
 * a STUDENT account and only a STUDENT account; lecturers are provisioned by an
 * administrator who issues a single-use access code, redeemed at
 * /register/lecturer. The server enforces this regardless of what the client
 * sends, so this is presentation only — but presenting a privileged role as a
 * self-service choice is misleading in the first place.
 */
interface RegisterFormProps {
  oauthProviders: { google: boolean; facebook: boolean };
}

export function RegisterForm({ oauthProviders }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — academic details
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [semester, setSemester] = useState("");
  const [programId, setProgramId] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Step 3 — policies
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Reference data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [maxSemesters, setMaxSemesters] = useState(8);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (step !== 2 || faculties.length > 0) return;

    setIsDataLoading(true);
    setError("");

    fetch("/api/users/faculties")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((data) => {
        if (!data.success) {
          setError(data.error || "Failed to load faculty data");
          return;
        }
        setFaculties(data.data.faculties);
        setPrograms(data.data.programs);
        if (data.data.maxSemesters) setMaxSemesters(data.data.maxSemesters);
        if (data.data.faculties.length === 0) {
          setError(
            "No active faculties are configured yet. Please contact an administrator.",
          );
        }
      })
      .catch(() => {
        setError("Could not load faculty data. Please check your connection.");
      })
      .finally(() => setIsDataLoading(false));
  }, [step, faculties.length]);

  const filteredPrograms = useMemo(
    () => programs.filter((p) => p.facultyId === facultyId),
    [programs, facultyId],
  );

  function canProceed() {
    switch (step) {
      case 1:
        return name.trim().length >= 2 && email.includes("@") && password.length >= 10;
      case 2:
        return Boolean(studentId.trim() && facultyId && semester && programId);
      case 3:
        return termsAccepted && privacyAccepted;
      default:
        return false;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Earlier steps submit by advancing rather than posting, so Enter behaves
    // the way it does in any other multi-step form.
    if (step < TOTAL_STEPS) {
      if (canProceed()) setStep(step + 1);
      return;
    }

    if (!canProceed() || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          studentId,
          facultyId,
          semester: Number(semester),
          programId,
          referralCode: referralCode || undefined,
          termsAccepted,
          privacyAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        // Send the user back to the step that owns the failing field.
        if (/email|password|name/i.test(data.error ?? "")) setStep(1);
        else if (/student id|faculty|program|semester/i.test(data.error ?? "")) {
          setStep(2);
        }
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        portal: "STUDENT",
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setIsLoading(true);
    setError("");
    try {
      await signIn(provider, { callbackUrl: "/setup" });
    } catch {
      setError(`Failed to sign up with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          <h1>Create your student account</h1>
        </CardTitle>
        <CardDescription>
          Step {step} of {TOTAL_STEPS}
        </CardDescription>
        <div
          className="flex justify-center gap-1 pt-2"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label={`Registration progress: step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ibrahim Sesay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 10 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    minLength={10}
                    required
                    aria-describedby="password-hint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Use at least 10 characters.
                </p>
              </div>

              {(oauthProviders.google || oauthProviders.facebook) && (
                <>
                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or sign up with
                    </span>
                  </div>

                  <div
                    className={
                      oauthProviders.google && oauthProviders.facebook
                        ? "grid grid-cols-2 gap-3"
                        : "grid gap-3"
                    }
                  >
                    {oauthProviders.google && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuth("google")}
                        disabled={isLoading}
                      >
                        Google
                      </Button>
                    )}
                    {oauthProviders.facebook && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuth("facebook")}
                        disabled={isLoading}
                      >
                        Facebook
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  name="studentId"
                  placeholder="e.g. 905001234"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">
                  Faculty
                  {isDataLoading && (
                    <Loader2
                      className="ml-1 inline size-3 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                </Label>
                <Select
                  value={facultyId || null}
                  onValueChange={(v) => {
                    if (v !== null) {
                      setFacultyId(v);
                      setProgramId(""); // program depends on faculty
                    }
                  }}
                  disabled={isDataLoading || isLoading}
                >
                  <SelectTrigger id="faculty" aria-label="Faculty" className="w-full">
                    <SelectValue
                      placeholder={isDataLoading ? "Loading..." : "Select faculty"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={semester || null}
                  onValueChange={(v) => v !== null && setSemester(v)}
                  disabled={isDataLoading || isLoading}
                >
                  <SelectTrigger id="semester" aria-label="Semester" className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select
                  value={programId || null}
                  onValueChange={(v) => v !== null && setProgramId(v)}
                  disabled={!facultyId || filteredPrograms.length === 0 || isLoading}
                >
                  <SelectTrigger id="program" aria-label="Program" className="w-full">
                    <SelectValue
                      placeholder={
                        !facultyId
                          ? "Select a faculty first"
                          : filteredPrograms.length === 0
                            ? "No programs found"
                            : "Select program"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral">Referral code (optional)</Label>
                <Input
                  id="referral"
                  name="referralCode"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(v === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(v) => setPrivacyAccepted(v === true)}
                />
                <Label htmlFor="privacy" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            <Button type="submit" disabled={!canProceed() || isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              )}
              {step < TOTAL_STEPS ? (
                <>
                  Next
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Teaching staff: your administrator will issue you an access code.{" "}
          <Link href="/register/lecturer" className="text-primary hover:underline">
            Redeem a lecturer code
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
