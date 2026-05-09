"use client";

import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderContentProps {
  title: string;
  subtitle?: string;
}

export function DashboardPageHeaderContent({
  title,
  subtitle,
}: PageHeaderContentProps) {
  return (
    <div className="px-5 pt-5 pb-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#999] mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#999] hover:text-white"
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-[#6fcf2e] text-[#0d2200] hover:bg-[#5cb82c]"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>
    </div>
  );
}
