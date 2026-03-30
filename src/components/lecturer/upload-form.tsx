"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatFileSize } from "@/lib/utils";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
};

const MAX_SIZE = 50 * 1024 * 1024;

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    module: "",
    moduleCode: "",
    facultyId: "",
    semester: "",
    programId: "",
    contentType: "",
    description: "",
    tutorialLink: "",
  });

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: async () => {
      const res = await fetch("/api/faculties");
      return res.json();
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ["app-settings-semesters"],
    queryFn: async () => {
      const res = await fetch("/api/settings/public");
      return res.json();
    },
  });

  const { data: programsData } = useQuery({
    queryKey: ["programs", formData.facultyId],
    queryFn: async () => {
      const res = await fetch(`/api/programs?facultyId=${formData.facultyId}`);
      return res.json();
    },
    enabled: !!formData.facultyId,
  });

  const faculties: Faculty[] = facultiesData?.data ?? [];
  const programs: Program[] = programsData?.data ?? [];
  const maxSemesters: number = settingsData?.data?.maxSemesters ?? 8;

  const upload = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/lecturer/content", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      router.push("/content");
    },
  });

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES[f.type]) {
      return "Unsupported file type. Allowed: PDF, PPTX, DOCX, JPEG, PNG";
    }
    if (f.size > MAX_SIZE) {
      return "File size exceeds 50MB limit";
    }
    return null;
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (!dropped) return;
      const error = validateFile(dropped);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError(null);
      setFile(dropped);
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      const error = validateFile(selected);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError(null);
      setFile(selected);
    },
    [validateFile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("title", formData.title);
    data.append("module", formData.module);
    data.append("facultyId", formData.facultyId);
    data.append("semester", formData.semester);
    data.append("contentType", formData.contentType);

    if (formData.moduleCode) data.append("moduleCode", formData.moduleCode);
    if (formData.programId) data.append("programId", formData.programId);
    if (formData.description) data.append("description", formData.description);
    if (formData.tutorialLink)
      data.append("tutorialLink", formData.tutorialLink);

    upload.mutate(data);
  };

  const updateField = (field: string, value: string | null) => {
    if (value === null) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "facultyId") {
      setFormData((prev) => ({ ...prev, programId: "" }));
    }
  };

  const isValid =
    formData.title &&
    formData.module &&
    formData.facultyId &&
    formData.semester &&
    formData.contentType &&
    file;

  const FileIcon = file?.type.startsWith("image/") ? Image : FileText;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Metadata */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Introduction to Data Structures"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="module">Module / Course Name *</Label>
              <Input
                id="module"
                value={formData.module}
                onChange={(e) => updateField("module", e.target.value)}
                placeholder="e.g. Computer Science 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleCode">Module Code</Label>
              <Input
                id="moduleCode"
                value={formData.moduleCode}
                onChange={(e) => updateField("moduleCode", e.target.value)}
                placeholder="e.g. CS101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty *</Label>
            <Select
              value={formData.facultyId}
              onValueChange={(v) => updateField("facultyId", v)}
            >
              <SelectTrigger id="faculty">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select
                value={formData.semester}
                onValueChange={(v) => updateField("semester", v)}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxSemesters }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Semester {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select
                value={formData.programId}
                onValueChange={(v) => updateField("programId", v)}
                disabled={!formData.facultyId}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type *</Label>
            <Select
              value={formData.contentType}
              onValueChange={(v) => updateField("contentType", v)}
            >
              <SelectTrigger id="contentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description ({formData.description.length}/500)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                updateField("description", e.target.value.slice(0, 500))
              }
              placeholder="Brief description of this content..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutorialLink">Tutorial Link</Label>
            <Input
              id="tutorialLink"
              type="url"
              value={formData.tutorialLink}
              onChange={(e) => updateField("tutorialLink", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Right column: File upload */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload File *</CardTitle>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <Upload className="mb-3 size-10 text-muted-foreground" />
                  <p className="mb-1 text-sm font-medium">
                    Drag and drop your file here
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    PDF, PPTX, DOCX, JPEG, or PNG (max 50MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                  >
                    Browse Files
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.pptx,.docx,.jpeg,.jpg,.png"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <FileIcon className="size-8 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACCEPTED_TYPES[file.type]} &middot;{" "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setFileError(null);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              {fileError && (
                <p className="mt-2 text-sm text-destructive">{fileError}</p>
              )}
            </CardContent>
          </Card>

          {upload.error && (
            <p className="text-sm text-destructive">
              {upload.error.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || upload.isPending}>
          {upload.isPending ? (
            <>
              <Spinner className="mr-2 size-4" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload Content
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
