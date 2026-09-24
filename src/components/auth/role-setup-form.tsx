"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Loader2 } from "lucide-react";

type Faculty = { id: string; name: string; code: string };
type Program = { id: string; name: string; code: string; facultyId: string };

export function RoleSetupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [semester, setSemester] = useState("");
  const [programId, setProgramId] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [maxSemesters, setMaxSemesters] = useState(8);

  useEffect(() => {
    fetch("/api/users/faculties")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setFaculties(data.data.faculties);
          setPrograms(data.data.programs);
          if (data.data.maxSemesters) setMaxSemesters(data.data.maxSemesters);
          if (data.data.faculties.length === 0) {
            setError("No active faculties are configured yet. Please contact an administrator.");
          }
        } else {
          setError("Failed to load faculty data. Please refresh the page.");
        }
      })
      .catch((err) => {
        console.error("Setup data fetch error:", err);
        setError("Could not load faculty data. Please check your connection.");
      })
      .finally(() => setIsLoadingData(false));
  }, []);

  const filteredPrograms = programs.filter((p) => p.facultyId === facultyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          facultyId,
          semester: Number(semester),
          programId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed");
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          <h1>Complete Your Profile</h1>
        </CardTitle>
        <CardDescription>
          Select your faculty, semester, and program to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="setup-studentId">Student ID</Label>
            <Input
              id="setup-studentId"
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
            <Label>Faculty</Label>
            <Select 
              value={facultyId || null}
              onValueChange={(v) => {
                if (v !== null) {
                  setFacultyId(v);
                  setProgramId(""); // Reset program when faculty changes
                }
              }}
              disabled={isLoadingData || isLoading}
            >
              <SelectTrigger id="setup-faculty" aria-label="Faculty">
                <SelectValue placeholder={isLoadingData ? "Loading faculties..." : "Select faculty"} />
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
            <Select 
              value={semester || null}
              onValueChange={(v) => v !== null && setSemester(v)}
              disabled={isLoadingData || isLoading}
            >
              <SelectTrigger id="setup-semester" aria-label="Semester">
                <SelectValue placeholder={isLoadingData ? "Loading semesters..." : "Select semester"} />
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
              value={programId || null}
              onValueChange={(v) => v !== null && setProgramId(v)}
              disabled={!facultyId || filteredPrograms.length === 0}
            >
              <SelectTrigger id="setup-program" aria-label="Program">
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
          <Button
            type="submit"
            className="w-full"
            disabled={
              !studentId.trim() || !facultyId || !semester || !programId || isLoading
            }
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
