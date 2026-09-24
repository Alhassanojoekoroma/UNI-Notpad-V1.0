"use client";

import { useState, useEffect } from "react";
import { CollectionCard } from "@/components/content/collection-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Collection {
  id: string;
  module: string;
  category: string;
  materialCount: number;
  semester: number;
  progress: number;
}

const gradients = [
  "linear-gradient(145deg, #c8c2f7 0%, #dcd8fb 100%)",
  "linear-gradient(145deg, #62e0c8 0%, #a0f5e6 100%)",
  "linear-gradient(145deg, #96e860 0%, #c8f598 100%)",
  "linear-gradient(145deg, #f5a0b8 0%, #fcc8d5 100%)",
  "linear-gradient(145deg, #ffa756 0%, #ffc99d 100%)",
  "linear-gradient(145deg, #7ec8e3 0%, #a8dce8 100%)",
];

export default function BrowseContentPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const semesters = [
    { value: "all", label: "All Semesters" },
    { value: "1", label: "Semester 1" },
    { value: "2", label: "Semester 2" },
    { value: "3", label: "Semester 3" },
    { value: "4", label: "Semester 4" },
    { value: "5", label: "Semester 5" },
    { value: "6", label: "Semester 6" },
    { value: "7", label: "Semester 7" },
    { value: "8", label: "Semester 8" },
  ];

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCollections() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/content/collections", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Course materials could not be loaded.");
        }
        setCollections(data.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Course materials could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void fetchCollections();
    return () => controller.abort();
  }, [requestVersion]);

  const filteredCollections = selectedSemester === "all"
    ? collections
    : collections.filter((collection) => collection.semester === Number(selectedSemester));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
        <p className="text-muted-foreground mt-1">
          Browse and study course materials from your lecturers
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Filter by:</label>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((sem) => (
                <SelectItem key={sem.value} value={sem.value}>
                  {sem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center" role="alert">
          <p className="font-medium">We could not load your course materials.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => setRequestVersion((version) => version + 1)}>
            Try again
          </Button>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No materials available for the selected semester
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCollections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              title={collection.module}
              module={collection.module}
              category={
                collection.category as
                  | "lecture"
                  | "assignment"
                  | "tutorial"
                  | "project"
                  | "lab"
                  | "other"
              }
              materialCount={collection.materialCount}
              semester={collection.semester}
              progress={collection.progress}
              gradient={gradients[index % gradients.length]}
              href={`/content/collection/${collection.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
