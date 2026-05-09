"use client";

import { ChevronDown } from "lucide-react";
import { FileRow } from "./file-row";

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

interface WeekAccordionProps {
  week: number;
  materials: Material[];
  isExpanded: boolean;
  onToggle: () => void;
  onFileClick: (fileId: string) => void;
}

export function WeekAccordion({
  week,
  materials,
  isExpanded,
  onToggle,
  onFileClick,
}: WeekAccordionProps) {
  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
            W{week}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Week {week}</h3>
            <p className="text-sm text-muted-foreground">
              {materials.length} {materials.length === 1 ? "file" : "files"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t bg-muted/30">
          <div className="divide-y">
            {materials.map((material) => (
              <FileRow
                key={material.id}
                material={material}
                onClick={() => onFileClick(material.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
