"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";

type PdfViewerProps = {
  url: string;
  title: string;
};

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    const elem = document.getElementById("pdf-container");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
          >
            <Maximize className="size-4" />
          </Button>
        </div>
      </div>
      <iframe
        src={`${url}#toolbar=1`}
        className="w-full min-h-[600px] flex-1"
        title={title}
      />
    </div>
  );
}
