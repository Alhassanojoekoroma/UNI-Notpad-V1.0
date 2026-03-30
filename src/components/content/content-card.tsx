"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Star } from "lucide-react";

type ContentCardProps = {
  id: string;
  title: string;
  module: string;
  lecturerName: string | null;
  fileType: string;
  contentType: string;
  viewCount: number;
  downloadCount: number;
  averageRating: number | null;
};

const fileTypeBadgeColors: Record<string, string> = {
  pdf: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  pptx: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  docx: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  jpeg: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  png: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
};

export function ContentCard({
  id,
  title,
  module,
  lecturerName,
  fileType,
  contentType,
  viewCount,
  downloadCount,
  averageRating,
}: ContentCardProps) {
  return (
    <Link href={`/content/${id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-snug line-clamp-2">{title}</h3>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${fileTypeBadgeColors[fileType] ?? ""}`}
            >
              {fileType.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{module}</p>
          {lecturerName && (
            <p className="text-xs text-muted-foreground">by {lecturerName}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Download className="size-3" />
              {downloadCount}
            </span>
            {averageRating !== null && (
              <span className="flex items-center gap-1">
                <Star className="size-3 fill-yellow-500 text-yellow-500" />
                {averageRating.toFixed(1)}
              </span>
            )}
            <Badge variant="secondary" className="text-xs ml-auto">
              {contentType.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
