"use client";

import { FileText, File } from "lucide-react";

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

interface FileRowProps {
  material: Material;
  onClick: () => void;
}

export function FileRow({ material, onClick }: FileRowProps) {
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "pptx":
      case "ppt":
        return <File className="w-5 h-5 text-orange-500" />;
      case "jpeg":
      case "jpg":
      case "png":
        return <File className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    return contentType.replace(/_/g, " ");
  };

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/80 transition-colors text-left"
    >
      <div className="flex-shrink-0 mt-1">{getFileIcon(material.fileType)}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground line-clamp-2">
          {material.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{material.lecturer.name}</span>
          <span>•</span>
          <span className="capitalize">{getContentTypeLabel(material.contentType)}</span>
          <span>•</span>
          <span className="uppercase">{material.fileType}</span>
        </div>
        {material.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {material.description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-xs font-medium text-primary whitespace-nowrap ml-2">
        View
      </div>
    </button>
  );
}
