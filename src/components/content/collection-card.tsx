"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CollectionCardProps {
  id: string;
  title: string;
  module: string;
  category?: "lecture" | "assignment" | "tutorial" | "project" | "lab" | "other";
  materialCount: number;
  semester: number;
  progress?: number;
  gradient: string;
  href: string;
}

const categoryColors: Record<
  string,
  {
    badgeBg: string;
    badgeText: string;
    progressColor: string;
    text: string;
    deco: React.ReactNode;
  }
> = {
  lecture: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#7468d0",
    text: "Design",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="125" height="125" viewBox="0 0 125 125">
        <circle cx="78" cy="28" r="42" fill="white" opacity="0.38" />
        <circle cx="105" cy="68" r="38" fill="white" opacity="0.38" />
        <circle cx="55" cy="82" r="32" fill="white" opacity="0.38" />
      </svg>
    ),
  },
  assignment: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#1ec8aa",
    text: "Languages",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="130" height="130" viewBox="0 0 130 130">
        <ellipse cx="88" cy="30" rx="52" ry="40" fill="white" opacity="0.38" transform="rotate(-20 88 30)" />
        <ellipse cx="72" cy="82" rx="48" ry="36" fill="white" opacity="0.38" transform="rotate(18 72 82)" />
      </svg>
    ),
  },
  tutorial: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#52b820",
    text: "Tutorials",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="130" height="130" viewBox="0 0 130 130">
        <ellipse cx="82" cy="35" rx="55" ry="40" fill="white" opacity="0.38" transform="rotate(10 82 35)" />
        <ellipse cx="65" cy="85" rx="50" ry="36" fill="white" opacity="0.38" transform="rotate(-8 65 85)" />
      </svg>
    ),
  },
  project: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#e8607a",
    text: "Projects",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="128" height="128" viewBox="0 0 128 128">
        <ellipse cx="95" cy="18" rx="32" ry="18" fill="white" opacity="0.40" transform="rotate(35 95 18)" />
        <ellipse cx="112" cy="50" rx="30" ry="17" fill="white" opacity="0.40" transform="rotate(70 112 50)" />
        <ellipse cx="100" cy="82" rx="32" ry="18" fill="white" opacity="0.40" transform="rotate(110 100 82)" />
        <ellipse cx="72" cy="96" rx="30" ry="17" fill="white" opacity="0.40" transform="rotate(150 72 96)" />
        <ellipse cx="50" cy="72" rx="28" ry="16" fill="white" opacity="0.40" transform="rotate(190 50 72)" />
      </svg>
    ),
  },
  lab: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#ffa756",
    text: "Lab",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="125" height="125" viewBox="0 0 125 125">
        <circle cx="78" cy="28" r="42" fill="white" opacity="0.38" />
        <circle cx="105" cy="68" r="38" fill="white" opacity="0.38" />
      </svg>
    ),
  },
  other: {
    badgeBg: "bg-white/88",
    badgeText: "text-[#444]",
    progressColor: "#7ec8e3",
    text: "Resources",
    deco: (
      <svg className="absolute -right-2 -top-2 pointer-events-none z-0" width="125" height="125" viewBox="0 0 125 125">
        <circle cx="78" cy="28" r="42" fill="white" opacity="0.38" />
        <circle cx="55" cy="82" r="32" fill="white" opacity="0.38" />
      </svg>
    ),
  },
};

export function CollectionCard({
  title,
  category = "lecture",
  materialCount,
  progress = 0,
  gradient,
  href,
}: CollectionCardProps) {
  const categoryInfo = categoryColors[category] || categoryColors.other;

  return (
    <Link href={href} className="no-underline block">
      <div
        className="rounded-[22px] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1"
        style={{ background: gradient }}
      >
        {/* Top Section */}
        <div className="p-[18px] pb-3 flex-grow min-h-[135px] relative overflow-hidden flex flex-col justify-between">
          {/* Decorative Vector */}
          {categoryInfo.deco}

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full justify-between flex-grow">
            <div>
              <span className={`inline-block ${categoryInfo.badgeBg} ${categoryInfo.badgeText} rounded-[20px] px-[11px] py-[3px] text-[11.5px] font-semibold mb-3 shadow-xs`}>
                {categoryInfo.text}
              </span>
              <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-1 line-clamp-2 leading-snug font-sans">
                {title}
              </h3>
            </div>
            <p className="text-[12.5px] text-[#2a2a3a] opacity-65 mt-2 font-sans font-medium">
              {materialCount} {materialCount === 1 ? "material" : "materials"}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bg-white/72 backdrop-blur-[4px] px-[18px] py-[13px] flex items-center justify-between gap-3 border-t border-white/20">
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-gray-800 mb-1.5 font-sans">
              {progress}% completed
            </div>
            <div className="h-[4px] bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: categoryInfo.progressColor,
                }}
              ></div>
            </div>
          </div>
          <div className="flex-shrink-0 w-[34px] h-[34px] rounded-[10px] bg-white border border-black/12 flex items-center justify-center transition-all hover:scale-105 duration-200 shadow-xs cursor-pointer">
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.8] text-gray-700" />
          </div>
        </div>
      </div>
    </Link>
  );
}
