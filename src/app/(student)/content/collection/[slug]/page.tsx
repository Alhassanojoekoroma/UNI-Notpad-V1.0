"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { WeekAccordion } from "@/components/content/week-accordion";

interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  contentType: string;
  week: number;
  lecturer: {
    name: string;
  };
}

interface GroupedMaterials {
  [week: number]: Material[];
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug: rawSlug } = React.use(params);
  const slug = decodeURIComponent(rawSlug);
  
  // Parse slug: "module-semester" format
  const lastDashIndex = slug.lastIndexOf("-");
  const module = slug.substring(0, lastDashIndex);
  const semester = slug.substring(lastDashIndex + 1);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [groupedMaterials, setGroupedMaterials] = useState<GroupedMaterials>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/content/collections/${encodeURIComponent(module)}?semester=${semester}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        // Filter only approved materials (status ACTIVE)
        const approved = data.data.filter((m: any) => m.status === "ACTIVE");
        setMaterials(approved);

        // Group by week
        const grouped: GroupedMaterials = {};
        approved.forEach((material: Material) => {
          const week = material.week || 1;
          if (!grouped[week]) {
            grouped[week] = [];
          }
          grouped[week].push(material);
        });

        setGroupedMaterials(grouped);

        // Expand all weeks by default
        const allWeeks = new Set(Object.keys(grouped).map(Number));
        setExpandedWeeks(allWeeks);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(week)) {
        newSet.delete(week);
      } else {
        newSet.add(week);
      }
      return newSet;
    });
  };

  const weeks = Object.keys(groupedMaterials)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Materials
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{module}</h1>
        <p className="text-muted-foreground mt-2">
          Semester {semester}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground text-lg">
            No materials available yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => (
            <WeekAccordion
              key={week}
              week={week}
              materials={groupedMaterials[week]}
              isExpanded={expandedWeeks.has(week)}
              onToggle={() => toggleWeek(week)}
              onFileClick={(fileId) => {
                router.push(
                  `/content/collection/${slug}/${fileId}`
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
