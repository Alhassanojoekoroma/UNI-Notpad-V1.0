"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize, AlertCircle } from "lucide-react";

type PdfViewerProps = {
  url: string;
  title: string;
};

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);

  function toggleFullscreen() {
    const elem = document.getElementById("pdf-container");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen failed:", err);
      });
    }
  }

  // Use browser's native PDF viewer via iframe for reliability
  return (
    <div id="pdf-container" className="flex flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium truncate">{title}</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
          >
            <Maximize className="size-4" />
          </Button>
        </div>
      </div>
      {loadError ? (
        <div className="w-full min-h-[600px] flex-1 flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium">Failed to load PDF</p>
            <p className="text-xs text-muted-foreground">Please try again or download the file</p>
            <a href={url} download={title}>
              <Button variant="outline" size="sm">
                Download Instead
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={`${url}#toolbar=1`}
          className="w-full min-h-[600px] flex-1"
          title={title}
          onError={() => setLoadError(true)}
          sandbox="allow-same-origin allow-popups"
        />
      )}
    </div>
  );
}
