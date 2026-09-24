"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "ghost";
  }>;
}

export function DashboardPageHeader({
  title,
  subtitle,
  showBack = false,
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-5 py-3.5 pb-2.5">
      {/* Left section */}
      <div className="flex items-center gap-2.25">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="w-6.5 h-6.5 rounded-full bg-[#1a1a22] border border-[#2a2a36] hover:bg-[#252530] flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3 stroke-[#555] stroke-2" />
          </Button>
        )}
        <div>
          <h1 className="text-[22px] font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Right section: Action buttons */}
      <div className="flex items-center gap-1.75">
        {actions?.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Button
              key={idx}
              variant={action.variant || "ghost"}
              size="icon"
              onClick={action.onClick}
              className={cn(
                "flex-shrink-0",
                action.variant === "default"
                  ? "bg-[#6fcf2e] text-[#0d2200] hover:bg-[#5ab824]"
                  : "w-7 h-7 rounded-lg bg-[#1a1a22] border border-[#2a2a36] hover:bg-[#252530]"
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    action.variant === "default"
                      ? "w-2.75 h-2.75"
                      : "w-3.25 h-3.25"
                  )}
                />
              ) : (
                action.label
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
