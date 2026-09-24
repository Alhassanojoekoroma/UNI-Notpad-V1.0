"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType: string;
  week: number;
  contentType: string;
  onMarkAsRead: () => void;
}

export function FileViewer({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  week,
  contentType,
  onMarkAsRead,
}: FileViewerProps) {
  const [isMarked, setIsMarked] = useState(false);

  if (!isOpen) return null;

  const handleMarkAsRead = async () => {
    await onMarkAsRead();
    setIsMarked(true);
  };

  const getViewerContent = () => {
    const lowerFileType = fileType.toLowerCase();

    if (lowerFileType === "pdf") {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title="PDF Viewer"
        />
      );
    }

    if (lowerFileType === "docx" || lowerFileType === "pptx") {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        fileUrl
      )}&embedded=true`;
      return (
        <iframe
          src={googleDocsUrl}
          className="w-full h-full"
          title="Document Viewer"
        />
      );
    }

    if (
      lowerFileType === "jpeg" ||
      lowerFileType === "jpg" ||
      lowerFileType === "png"
    ) {
      return (
        <Image
            src={fileUrl}
            alt={fileName}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-contain"
          />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
          <a href={fileUrl} download>
            <Button>
              <Download className="mr-2 w-4 h-4" />
              Download File
            </Button>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl flex flex-col max-w-4xl w-full h-[90vh]">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground line-clamp-1">
              {fileName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Week {week} • {contentType.replace(/_/g, " ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewer */}
        <div className="relative flex-1 overflow-hidden bg-muted/20">
          {getViewerContent()}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <a href={fileUrl} download>
            <Button variant="outline">
              <Download className="mr-2 w-4 h-4" />
              Download
            </Button>
          </a>
          <Button
            onClick={handleMarkAsRead}
            variant={isMarked ? "outline" : "default"}
            disabled={isMarked}
          >
            {isMarked ? "✓ Marked as Read" : "Mark as Read"}
          </Button>
        </div>
      </div>
    </div>
  );
}
