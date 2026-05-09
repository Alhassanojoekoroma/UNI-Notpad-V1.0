"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricData {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface TimelineWeek {
  week: string;
  progress: number;
  status: "completed" | "in-progress" | "pending";
  colors: string[]; // Avatar colors for course indicators
  initials: string[]; // Course initials
}

interface MetricsAndTimelineProps {
  metrics: MetricData[];
  timeline: TimelineWeek[];
}

export function MetricsAndTimeline({ metrics, timeline }: MetricsAndTimelineProps) {
  return (
    <Card className="bg-[#181820] border-0 rounded-3.5 p-4.5">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-0 py-4 mb-4 border-b border-[#23232e]">
        {metrics.map((metric, idx) => (
          <div key={idx} className={cn("px-3.5", idx > 0 && "border-l border-[#23232e]")}>
            <div className="text-[10px] text-[#444] mb-1.5 uppercase tracking-wider">
              {metric.label}
            </div>
            <div className="text-lg font-bold text-white leading-tight">
              {metric.value}
            </div>
            {metric.subtitle && (
              <div className="text-[10px] text-[#555] mt-0.75">
                {metric.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-4 gap-2.5">
        {timeline.map((week, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            {/* Week Label */}
            <div className="text-[10px] text-[#555] font-medium">{week.week}</div>

            {/* Progress Bar */}
            <div className="h-1 bg-[#23232e] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  week.status === "completed"
                    ? "bg-[#6fcf2e]"
                    : week.status === "in-progress"
                      ? "bg-[#f0c060]"
                      : "bg-[#333]"
                )}
                style={{ width: `${week.progress}%` }}
              />
            </div>

            {/* Avatars */}
            <div className="flex -space-x-1.25">
              {week.initials.map((initial, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-[6px] flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                  style={{ backgroundColor: week.colors[i] }}
                >
                  {initial}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
