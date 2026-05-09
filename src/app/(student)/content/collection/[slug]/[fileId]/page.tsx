"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

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

export default function FileViewerPage({
  params,
}: {
  params: Promise<{ slug: string; fileId: string }>;
}) {
  const router = useRouter();
  const { slug: rawSlug, fileId } = React.use(params);
  const slug = decodeURIComponent(rawSlug);

  // Parse slug: "module-semester" format
  const lastDashIndex = slug.lastIndexOf("-");
  const module = slug.substring(0, lastDashIndex);
  const semester = slug.substring(lastDashIndex + 1);

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarked, setIsMarked] = useState(false);

  useEffect(() => {
    fetchMaterial();
  }, []);

  const fetchMaterial = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/content/collections/${encodeURIComponent(module)}?semester=${semester}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const file = data.data.find((m: any) => m.id === fileId);
        if (file) {
          setMaterial(file);
        }
      }
    } catch (error) {
      console.error("Failed to fetch material:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      // TODO: Call API to mark content as read
      // await fetch(`/api/content/${fileId}/mark-read`, { method: "POST" });
      setIsMarked(true);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getViewerContent = () => {
    if (!material) return null;

    const lowerFileType = material.fileType.toLowerCase();

    if (lowerFileType === "pdf") {
      return (
        <iframe
          src={`${material.fileUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title="PDF Viewer"
        />
      );
    }

    if (lowerFileType === "docx" || lowerFileType === "pptx") {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        material.fileUrl
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
        <img
          src={material.fileUrl}
          alt={material.title}
          className="w-full h-full object-contain"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Preview not available for this file type</p>
          <a href={material.fileUrl} download>
            <Button>
              <Download className="mr-2 w-4 h-4" />
              Download File
            </Button>
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-600">File not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0 bg-gray-50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 line-clamp-1">
              {material.title}
            </h1>
          </div>
          <p className="text-sm text-gray-600 ml-8">
            Week {material.week} • {material.contentType.replace(/_/g, " ")} • By {material.lecturer.name}
          </p>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        {getViewerContent()}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-gray-50">
        <a href={material.fileUrl} download>
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
  );
}
