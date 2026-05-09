"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  code: string;
  name: string;
  progress: number;
  color: string;
  textColor: string;
}

interface ActiveCoursesProps {
  courses: CourseCardProps[];
  semester: number;
  enrolledCount: number;
}

export function ActiveCoursesCard({
  courses,
  semester,
  enrolledCount,
}: ActiveCoursesProps) {
  return (
    <Card className="bg-[#181820] border-0 rounded-3.5 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-[#444] mb-1.25 uppercase tracking-wider">
            Active Courses
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              {enrolledCount} Enrolled
            </span>
            <span className="inline-block border border-[#2a2a36] rounded-3 px-2.25 py-0.75 text-[10px] text-[#666]">
              Semester {semester}
            </span>
          </div>
        </div>
        <button className="w-5.5 h-5.5 rounded-full bg-[#1e1e2a] flex items-center justify-center hover:bg-[#2a2a36] transition-colors">
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#555"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </button>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-3 gap-1.75">
        {courses.map((course, idx) => (
          <div key={idx} className="bg-[#111116] rounded-2.5 p-2.5">
            <div
              className={cn(
                "text-xs font-bold mb-0.75 inline-block rounded-1.25 px-1.5 py-0.5",
                "bg-gradient-to-r text-white"
              )}
              style={{
                backgroundColor: course.color,
                color: course.textColor,
              }}
            >
              {course.progress}%
            </div>
            <div className="text-[9.5px] text-[#555] leading-tight">
              {course.name}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link href="/content">
        <Button className="w-full bg-white text-black hover:bg-[#f0f0f0] py-2 rounded-4.5 text-2.75 font-semibold flex items-center justify-center gap-1 mt-2">
          Browse all materials
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Button>
      </Link>
    </Card>
  );
}
