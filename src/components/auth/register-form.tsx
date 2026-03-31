"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

type Faculty = { id: string; name: string; code: string };
type Program = { id: string; name: string; code: string; facultyId: string };

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Auth
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Role
  const [role, setRole] = useState<"STUDENT" | "LECTURER" | "">("");

  // Step 3: Role-specific
  const [studentId, setStudentId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [semester, setSemester] = useState("");
  const [programId, setProgramId] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Step 4: Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Data for dropdowns
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [maxSemesters, setMaxSemesters] = useState(8);

  useEffect(() => {
    if (step === 3 && role === "STUDENT") {
      fetch("/api/users/faculties")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFaculties(data.data.faculties);
            setPrograms(data.data.programs);
            if (data.data.maxSemesters) setMaxSemesters(data.data.maxSemesters);
          }
        })
        .catch(() => {});
    }
  }, [step, role]);

  const filteredPrograms = programs.filter((p) => p.facultyId === facultyId);

  function canProceed() {
    switch (step) {
      case 1:
        return name.length >= 2 && email.includes("@") && password.length >= 8;
      case 2:
        return role !== "";
      case 3:
        if (role === "STUDENT") return facultyId && semester && programId;
        if (role === "LECTURER") return accessCode.length > 0;
        return true;
      case 4:
        return termsAccepted && privacyAccepted;
      default:
        return false;
    }
  }

  async function handleSubmit() {
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
          role,
          studentId: role === "STUDENT" ? studentId : undefined,
          accessCode: role === "LECTURER" ? accessCode : undefined,
          facultyId: role === "STUDENT" ? facultyId : undefined,
          semester: role === "STUDENT" ? Number(semester) : undefined,
          programId: role === "STUDENT" ? programId : undefined,
          referralCode: referralCode || undefined,
          termsAccepted,
          privacyAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
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
    await signIn(provider, { callbackUrl: "/setup" });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Step {step} of 4</CardDescription>
        <div className="flex gap-1 justify-center pt-2">
          {[1, 2, 3, 4].map((s) => (
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
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Ibrahim Sesay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or sign up with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={isLoading}
              >
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuth("facebook")}
                disabled={isLoading}
              >
                Facebook
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select your role to continue.
            </p>
            <div className="grid gap-3">
              {(["STUDENT", "LECTURER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    role === r
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">
                    {r === "STUDENT" ? "Student" : "Lecturer"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r === "STUDENT"
                      ? "Browse materials, use AI assistant, collaborate with peers"
                      : "Upload course materials, view analytics, communicate with students"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && role === "STUDENT" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="e.g. 905001234"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select value={facultyId} onValueChange={(v) => v !== null && setFacultyId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
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
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => v !== null && setSemester(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxSemesters }, (_, i) => i + 1).map(
                    (s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={programId}
                onValueChange={(v) => v !== null && setProgramId(v)}
                disabled={!facultyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
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
              <Label htmlFor="referral">Referral Code (optional)</Label>
              <Input
                id="referral"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {step === 3 && role === "LECTURER" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the access code provided by your administrator.
            </p>
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-primary hover:underline">
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
                <Link href="/privacy" target="_blank" className="text-primary hover:underline">
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
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || isLoading}
            >
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Account
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
