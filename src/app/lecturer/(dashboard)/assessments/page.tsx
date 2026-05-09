"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus, Edit, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

interface StudentGrade {
  id: string;
  studentName: string;
  studentId: string;
  moduleCode: string;
  score: number;
  grade: string;
  feedback: string;
}

export default function AssessmentPage() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");

  const { data: modulesData } = useQuery({
    queryKey: ["lecturer-modules"],
    queryFn: async () => {
      const res = await fetch("/api/lecturer/modules");
      if (!res.ok) throw new Error("Failed to fetch modules");
      return res.json();
    },
  });

  const { data: gradesData, isLoading } = useQuery({
    queryKey: ["assessments", selectedModule],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedModule) params.append("moduleId", selectedModule);
      const res = await fetch(`/api/lecturer/assessments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
    enabled: !!selectedModule,
  });

  const updateGrade = useMutation({
    mutationFn: async ({ id, score }: { id: string; score: number }) => {
      const res = await fetch(`/api/lecturer/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error("Failed to update grade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      setEditingId(null);
    },
  });

  const modules = modulesData?.data ?? [];
  const grades: StudentGrade[] = gradesData?.data ?? [];

  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const getGradeColor = (grade: string) => {
    if (["A", "A+"].includes(grade)) return "bg-green-100 text-green-800";
    if (["B", "B+"].includes(grade)) return "bg-blue-100 text-blue-800";
    if (["C", "C+"].includes(grade)) return "bg-yellow-100 text-yellow-800";
    if (["D"].includes(grade)) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const stats = {
    totalStudents: grades.length,
    averageScore: grades.length > 0 ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1) : 0,
    highestScore: grades.length > 0 ? Math.max(...grades.map((g) => g.score)) : 0,
    lowestScore: grades.length > 0 ? Math.min(...grades.map((g) => g.score)) : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="size-8" />
          Assessment & Grading
        </h1>
        <p className="text-muted-foreground">
          Manage student grades and assessments for your modules
        </p>
      </div>

      {/* Stats */}
      {selectedModule && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.highestScore}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lowest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.lowestScore}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={selectedModule} onValueChange={(value) => setSelectedModule(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a module to view grades" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module: any) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.code} - {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>
              {grades.length} student{grades.length !== 1 ? "s" : ""} graded
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student Grade</DialogTitle>
                <DialogDescription>
                  Add a new grade entry for a student
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Populated from API */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Input type="number" min="0" max="100" placeholder="0-100" />
                </div>
                <Button className="w-full">Save Grade</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-4 size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No grades recorded yet. Select a module to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.studentName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {grade.studentId}
                      </TableCell>
                      <TableCell>
                        {editingId === grade.id ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editScore}
                            onChange={(e) => setEditScore(e.target.value)}
                            className="w-20"
                          />
                        ) : (
                          grade.score
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(grade.grade)}>
                          {grade.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingId === grade.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updateGrade.isPending}
                            onClick={() =>
                              updateGrade.mutate({
                                id: grade.id,
                                score: Number(editScore),
                              })
                            }
                          >
                            {updateGrade.isPending ? (
                              <Spinner className="size-4" />
                            ) : (
                              <Save className="size-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(grade.id);
                              setEditScore(String(grade.score));
                            }}
                          >
                            <Edit className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
