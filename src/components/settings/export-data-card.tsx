"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Download } from "lucide-react";

type ExportType = "json" | "quiz_scores" | "content_access";

export function ExportDataCard() {
  const [loading, setLoading] = useState<ExportType | null>(null);

  async function handleExport(type: ExportType) {
    setLoading(type);
    try {
      const url =
        type === "json"
          ? "/api/users/me/export"
          : `/api/users/me/export?format=csv&type=${type}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download =
        type === "json"
          ? "my-data-export.json"
          : type === "quiz_scores"
            ? "quiz_scores.csv"
            : "content_access.csv";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export My Data</CardTitle>
        <CardDescription>
          Download a copy of all your data stored on this platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => handleExport("json")}
          disabled={loading !== null}
        >
          {loading === "json" ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Full JSON Export
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("quiz_scores")}
          disabled={loading !== null}
        >
          {loading === "quiz_scores" ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Quiz Scores (CSV)
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("content_access")}
          disabled={loading !== null}
        >
          {loading === "content_access" ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Content Access (CSV)
        </Button>
      </CardContent>
    </Card>
  );
}
