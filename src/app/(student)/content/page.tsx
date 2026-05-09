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

interface Collection {
  id: string;
  module: string;
  category: string;
  materialCount: number;
  semester: number;
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
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>("all");
  const [isLoading, setIsLoading] = useState(true);

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
    fetchCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [selectedSemester, collections]);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/content/collections");
      const data = await response.json();

      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCollections = () => {
    if (selectedSemester === "all") {
      setFilteredCollections(collections);
    } else {
      setFilteredCollections(
        collections.filter((c) => c.semester === Number(selectedSemester))
      );
    }
  };

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
              progress={Math.floor(Math.random() * 100)}
              gradient={gradients[index % gradients.length]}
              href={`/content/collection/${collection.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
