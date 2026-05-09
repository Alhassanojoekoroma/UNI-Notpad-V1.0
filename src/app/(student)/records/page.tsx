"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, PrinterIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AcademicRecord {
  id: string;
  moduleCode: string;
  moduleName: string;
  semester: number;
  credits: number;
  grade: string;
  score: number;
  status: "PASSED" | "FAILED" | "IN_PROGRESS" | "INCOMPLETE";
}

export default function AcademicRecordsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["academic-records"],
    queryFn: async () => {
      const res = await fetch("/api/student/academic-records");
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
  });

  const records: AcademicRecord[] = data?.data?.records ?? [];
  const summary = data?.data?.summary ?? {};

  const getGradeColor = (grade: string) => {
    if (["A", "A+"].includes(grade)) return "bg-green-100 text-green-800";
    if (["B", "B+"].includes(grade)) return "bg-blue-100 text-blue-800";
    if (["C", "C+"].includes(grade)) return "bg-yellow-100 text-yellow-800";
    if (["D", "D+"].includes(grade)) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASSED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadTranscript = async () => {
    const res = await fetch("/api/student/academic-records/transcript");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "academic-transcript.pdf";
    a.click();
  };

  const passedCount = records.filter((r) => r.status === "PASSED").length;
  const totalCredits = records
    .filter((r) => r.status === "PASSED")
    .reduce((sum, r) => sum + r.credits, 0);
  const gpa = summary.gpa ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="size-8" />
          Academic Records
        </h1>
        <p className="text-muted-foreground">
          View your academic transcript and performance history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Courses Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {records.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">credits earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(records.reduce((sum, r) => sum + r.score, 0) / records.length || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleDownloadTranscript} variant="outline">
          <Download className="mr-2 size-4" />
          Download Transcript (PDF)
        </Button>
        <Button variant="outline">
          <PrinterIcon className="mr-2 size-4" />
          Print Records
        </Button>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course History</CardTitle>
          <CardDescription>
            {records.length} record{records.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No academic records found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">
                        {record.moduleCode}
                      </TableCell>
                      <TableCell>{record.moduleName}</TableCell>
                      <TableCell>{record.semester}</TableCell>
                      <TableCell>{record.credits}</TableCell>
                      <TableCell className="font-medium">{record.score}</TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(record.grade)}>
                          {record.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>
            • This transcript is an official record of your academic performance
          </p>
          <p>
            • Grades are recorded as per the university grading scale (A+ to F)
          </p>
          <p>• GPA is calculated on a 4.0 scale</p>
          <p>
            • For official transcripts, please contact the Registrar's Office
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
