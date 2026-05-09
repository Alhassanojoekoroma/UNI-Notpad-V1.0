"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, X, FileText, Image, Check, ChevronsUpDown, Trash2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatFileSize, cn } from "@/lib/utils";

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
const MAX_FILES = 10;

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
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [openFaculty, setOpenFaculty] = useState(false);
  const [openProgram, setOpenProgram] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    module: "",
    moduleCode: "",
    facultyId: "",
    programId: "",
    contentType: "",
    description: "",
    tutorialLink: "",
  });

  const { data: facultiesData, isLoading: isLoadingFaculties, error: facultiesError } = useQuery({
    queryKey: ["faculties"],
    queryFn: async () => {
      const res = await fetch("/api/faculties");
      if (!res.ok) throw new Error("Failed to load faculties");
      return res.json();
    },
  });

  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["app-settings-semesters"],
    queryFn: async () => {
      const res = await fetch("/api/settings/public");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const { data: programsData, isLoading: isLoadingPrograms, error: programsError } = useQuery({
    queryKey: ["programs", formData.facultyId],
    queryFn: async () => {
      const res = await fetch(`/api/programs?facultyId=${formData.facultyId}`);
      if (!res.ok) throw new Error("Failed to load programs");
      return res.json();
    },
    enabled: !!formData.facultyId,
  });

  const upload = useMutation({
    mutationFn: async (uploadData: FormData[]) => {
      const results = [];
      for (const data of uploadData) {
        const res = await fetch("/api/lecturer/content", {
          method: "POST",
          body: data,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        results.push(json.data);
      }
      return results;
    },
    onSuccess: () => {
      router.push("/lecturer/content");
      router.refresh();
    },
  });

  const faculties = facultiesData?.data || [];
  const programs = programsData?.data || [];
  const maxSemesters = settingsData?.data?.maxSemesters || 8;

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
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileAddition(droppedFiles);
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      handleFileAddition(selectedFiles);
    },
    []
  );

  const handleFileAddition = (newFiles: File[]) => {
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed. You have ${files.length} selected.`);
      return;
    }

    const validFiles: File[] = [];
    let error: string | null = null;

    for (const f of newFiles) {
      const fileError = validateFile(f);
      if (fileError) {
        error = fileError;
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setFileError(null);
    } else if (error) {
      setFileError(error);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSemester = (semester: string) => {
    setSelectedSemesters((prev) =>
      prev.includes(semester)
        ? prev.filter((s) => s !== semester)
        : [...prev, semester]
    );
  };

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!formData.module.trim()) {
      alert("Please enter a module/course name");
      return;
    }
    if (!formData.facultyId) {
      alert("Please select a faculty");
      return;
    }
    if (selectedSemesters.length === 0) {
      alert("Please select at least one semester");
      return;
    }
    if (files.length === 0) {
      alert("Please upload at least one file");
      return;
    }
    if (!formData.contentType) {
      alert("Please select content type");
      return;
    }

    // Create FormData for each file and each semester combination
    const formDataArray: FormData[] = [];
    
    for (const file of files) {
      for (const semester of selectedSemesters) {
        const data = new FormData();
        data.append("title", formData.title);
        data.append("module", formData.module);
        data.append("moduleCode", formData.moduleCode);
        data.append("facultyId", formData.facultyId);
        data.append("programId", formData.programId);
        data.append("semester", semester);
        data.append("contentType", formData.contentType);
        data.append("description", formData.description);
        data.append("tutorialLink", formData.tutorialLink);
        data.append("file", file);
        formDataArray.push(data);
      }
    }

    upload.mutate(formDataArray);
  };

  const isValid =
    formData.title.trim() &&
    formData.module.trim() &&
    formData.facultyId &&
    selectedSemesters.length > 0 &&
    files.length > 0 &&
    formData.contentType;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Form fields */}
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Introduction to Database"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="module">Module/Course Name *</Label>
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
            {facultiesError && (
              <p className="text-sm text-destructive">Failed to load faculties. Please refresh the page.</p>
            )}
            <Popover open={openFaculty} onOpenChange={setOpenFaculty}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-10 px-3 py-2 text-left rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoadingFaculties}
                >
                  <span className="truncate text-sm">
                    {isLoadingFaculties ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="size-4" />
                        Loading faculties...
                      </span>
                    ) : formData.facultyId ? (
                      faculties.find((f: Faculty) => f.id === formData.facultyId)?.name
                    ) : (
                      "Select faculty"
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search faculty..." />
                  <CommandList>
                    {faculties.length === 0 && (
                      <CommandEmpty>
                        {isLoadingFaculties ? "Loading faculties..." : "No faculty found."}
                      </CommandEmpty>
                    )}
                    {faculties.length > 0 && (
                      <CommandGroup>
                        {faculties.map((f: Faculty) => (
                          <CommandItem
                            key={f.id}
                            value={f.name}
                            onSelect={() => {
                              updateField("facultyId", f.id);
                              setOpenFaculty(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4 shrink-0",
                                formData.facultyId === f.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{f.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Semesters * (Select at least one)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/30">
              {Array.from({ length: maxSemesters }, (_, i) => {
                const semValue = String(i + 1);
                return (
                  <div key={semValue} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sem-${semValue}`}
                      checked={selectedSemesters.includes(semValue)}
                      onCheckedChange={() => toggleSemester(semValue)}
                    />
                    <label
                      htmlFor={`sem-${semValue}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Sem {i + 1}
                    </label>
                  </div>
                );
              })}
            </div>
            {selectedSemesters.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedSemesters.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            {formData.facultyId && programsError && (
              <p className="text-sm text-destructive">Failed to load programs. Please try again.</p>
            )}
            <Popover open={openProgram && !!formData.facultyId} onOpenChange={setOpenProgram}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-10 px-3 py-2 text-left rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData.facultyId || isLoadingPrograms}
                >
                  <span className="truncate text-sm">
                    {!formData.facultyId
                      ? "Select a faculty first"
                      : isLoadingPrograms
                      ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="size-4" />
                          Loading programs...
                        </span>
                      )
                      : formData.programId
                      ? programs.find((p: Program) => p.id === formData.programId)?.name
                      : "Select program (optional)"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              {formData.facultyId && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search program..." />
                    <CommandList>
                      {programs.length === 0 && (
                        <CommandEmpty>
                          {isLoadingPrograms ? "Loading programs..." : "No program found."}
                        </CommandEmpty>
                      )}
                      {programs.length > 0 && (
                        <CommandGroup>
                          {programs.map((p: Program) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                updateField("programId", p.id);
                                setOpenProgram(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4 shrink-0",
                                  formData.programId === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{p.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type *</Label>
            <Select
              value={formData.contentType || ""}
              onValueChange={(v) => updateField("contentType", v || "")}
            >
              <SelectTrigger id="contentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              <CardTitle className="text-base">Upload Files * (Max {MAX_FILES})</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length < MAX_FILES && (
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
                    Drag and drop files here
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    PDF, PPTX, DOCX, JPEG, PNG (max 50MB each)
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
                    multiple
                    accept=".pdf,.pptx,.docx,.jpeg,.jpg,.png"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files: {files.length}/{MAX_FILES}
                  </p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                        <FileText className="size-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ACCEPTED_TYPES[file.type]} · {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="shrink-0"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {files.length < MAX_FILES && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        document.getElementById("file-input-2")?.click()
                      }
                    >
                      <Upload className="mr-2 size-4" />
                      Add More Files
                    </Button>
                  )}
                  <input
                    id="file-input-2"
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".pdf,.pptx,.docx,.jpeg,.jpg,.png"
                    onChange={handleFileSelect}
                  />
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
              Uploading {files.length} file{files.length !== 1 ? 's' : ''} to {selectedSemesters.length} semester{selectedSemesters.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload ({files.length} × {selectedSemesters.length} = {files.length * selectedSemesters.length} total)
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
