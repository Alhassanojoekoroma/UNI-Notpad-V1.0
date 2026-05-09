"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CollectionCardProps {
  id: string;
  title: string;
  module: string;
  category?: "lecture" | "assignment" | "tutorial" | "project" | "lab" | "other";
  materialCount: number;
  semester: number;
  progress?: number;
  gradient: string;
  href: string;
}

const categoryColors: Record<string, { bg: string; color: string; text: string }> = {
  lecture: { bg: "bg-purple-100", color: "#a78bfa", text: "Lectures" },
  assignment: { bg: "bg-blue-100", color: "#60a5fa", text: "Assignments" },
  tutorial: { bg: "bg-cyan-100", color: "#22d3ee", text: "Tutorials" },
  project: { bg: "bg-green-100", color: "#4ade80", text: "Projects" },
  lab: { bg: "bg-amber-100", color: "#fbbf24", text: "Lab Materials" },
  other: { bg: "bg-gray-100", color: "#9ca3af", text: "Resources" },
};

export function CollectionCard({
  id,
  title,
  module,
  category = "lecture",
  materialCount,
  semester,
  progress = 0,
  gradient,
  href,
}: CollectionCardProps) {
  const categoryInfo = categoryColors[category] || categoryColors.other;

  return (
    <Link href={href}>
      <div
        className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:scale-105 duration-300"
        style={{ background: gradient }}
      >
        {/* Top Section */}
        <div className="p-4 flex-1 min-h-[140px] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -right-2 -top-2 w-20 h-20 rounded-full bg-white opacity-30"></div>
          <div className="absolute -right-8 top-8 w-24 h-24 rounded-full bg-white opacity-20"></div>

          {/* Content */}
          <div className="relative z-10">
            <span className={`inline-block ${categoryInfo.bg} rounded-full px-3 py-1 text-xs font-medium text-gray-700 mb-3`}>
              {categoryInfo.text}
            </span>
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-gray-700 opacity-75">
              {materialCount} {materialCount === 1 ? "material" : "materials"}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bg-white bg-opacity-80 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-700 mb-1.5">
              {progress}% completed
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: categoryInfo.color,
                }}
              ></div>
            </div>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ArrowRight className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </div>
    </Link>
  );
}
