"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface Task {
  id: string;
  code: string;
  name: string;
  due: string;
  badge: string;
  badgeColor: "bg-r" | "bg-y" | "bg-b" | "bg-g";
  avatar: { bg: string; text: string; initials: string };
}

interface DashboardData {
  studentName: string;
  faculty: string;
  semester: number;
  unreadMessages: number;
  upcomingDeadlines: number;
  nextDeadlineDays: number | null;
  aiQueriesLeft: number;
  aiQueriesReset: string;
  tasks: Task[];
  activeCourses: Array<{
    id?: string;
    name: string;
    progressPercent: number;
  }>;
  weekProgress: Array<{
    week: string | number;
    progressPercent: number;
    participants: Array<{ initials: string }>;
  }>;
  enrolledCount: number;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  "bg-r": { bg: "#fde8e8", color: "#c0392b" },
  "bg-y": { bg: "#fef9e7", color: "#b7770d" },
  "bg-g": { bg: "#eafaf1", color: "#1e8449" },
  "bg-b": { bg: "#e8f4fd", color: "#1a6fa3" },
};

const TIMELINE_FILL = (pct: number) => pct === 100 ? "#6fcf2e" : pct > 10 ? "#f0c060" : "#333";

export function StudentDashboardClient({ data }: { data: DashboardData }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(data.tasks[0]?.id ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const selectedTask = data.tasks.find(t => t.id === selectedTaskId) ?? data.tasks[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
      {/* HEADER - Greeting */}
      <div style={{ padding: "20px 20px 10px", borderBottom: `1px solid ${isDark ? "#1e1e28" : "#e0e0e0"}` }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: isDark ? "#fff" : "#000", margin: 0 }}>
          Good morning, {data.studentName}
        </h1>
        <p style={{ fontSize: "13px", color: isDark ? "#666" : "#888", margin: "4px 0 0" }}>
          {data.faculty} — Semester {data.semester}
        </p>
      </div>

      {/* METRICS SECTION */}
      <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 300px)", gap: "12px" }}>
        {/* Metrics + Timeline */}
        <div style={{
          background: isDark ? "#181820" : "#fff",
          borderRadius: "12px", padding: "18px",
          border: isDark ? "none" : "1px solid #e0e0e0"
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            borderBottom: `1px solid ${isDark ? "#23232e" : "#e0e0e0"}`,
            paddingBottom: "16px", marginBottom: "16px"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", textTransform: "uppercase", marginBottom: "6px" }}>Unread Messages</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: isDark ? "#fff" : "#000" }}>{data.unreadMessages}</div>
              <div style={{ fontSize: "10px", color: isDark ? "#555" : "#aaa", marginTop: "4px" }}>Messages waiting</div>
            </div>
            <div style={{ borderLeft: `1px solid ${isDark ? "#23232e" : "#e0e0e0"}`, paddingLeft: "16px" }}>
              <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", textTransform: "uppercase", marginBottom: "6px" }}>Upcoming Deadlines</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: isDark ? "#fff" : "#000" }}>{data.upcomingDeadlines} tasks</div>
              <div style={{ fontSize: "10px", color: isDark ? "#555" : "#aaa", marginTop: "4px" }}>
                Next due in {data.nextDeadlineDays ?? 0} days
              </div>
            </div>
            <div style={{ borderLeft: `1px solid ${isDark ? "#23232e" : "#e0e0e0"}`, paddingLeft: "16px" }}>
              <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", textTransform: "uppercase", marginBottom: "6px" }}>AI Queries Left</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: isDark ? "#fff" : "#000" }}>{data.aiQueriesLeft}</div>
              <div style={{ fontSize: "10px", color: isDark ? "#555" : "#aaa", marginTop: "4px" }}>{data.aiQueriesReset}</div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {data.weekProgress.slice(0, 4).map((wk, idx) => (
              <div key={idx}>
                <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", marginBottom: "6px" }}>Week {idx + 1}</div>
                <div style={{ height: "4px", background: isDark ? "#23232e" : "#e0e0e0", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${wk.progressPercent}%`,
                    background: TIMELINE_FILL(wk.progressPercent), borderRadius: "2px"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Courses */}
        <div style={{
          background: isDark ? "#181820" : "#fff",
          borderRadius: "12px", padding: "16px",
          border: isDark ? "none" : "1px solid #e0e0e0"
        }}>
          <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", textTransform: "uppercase", marginBottom: "8px" }}>Active Courses</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: isDark ? "#fff" : "#000", marginBottom: "12px" }}>
            {data.enrolledCount} Enrolled
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {data.activeCourses.slice(0, 3).map((course, i) => (
              <div key={i} style={{
                background: isDark ? "#1a1a1f" : "#f5f5f5",
                borderRadius: "10px", padding: "12px",
                border: `1px solid ${isDark ? "#2a2a36" : "#e0e0e0"}`
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#6fcf2e", marginBottom: "4px" }}>
                  {course.progressPercent}%
                </div>
                <div style={{ fontSize: "11px", color: isDark ? "#666" : "#999" }}>{course.name}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.href = "/content"}
            style={{
              width: "100%", background: "#6fcf2e", color: "#0d2200",
              border: "none", padding: "10px", borderRadius: "8px",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", marginTop: "12px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            Browse materials →
          </button>
        </div>
      </div>

      {/* TASKS SECTION */}
      <div style={{ padding: "12px 20px 20px", flex: 1 }}>
        <div style={{
          background: isDark ? "#181820" : "#fff",
          borderRadius: "12px", border: isDark ? "none" : "1px solid #e0e0e0",
          display: "grid", gridTemplateColumns: "minmax(180px, 240px) minmax(0, 1fr)", minHeight: "360px", overflow: "hidden"
        }}>
          {/* Task List */}
          <div style={{ borderRight: `1px solid ${isDark ? "#2a2a36" : "#e0e0e0"}`, padding: "14px", overflowY: "auto" }}>
            {data.tasks.map(task => {
              const isActive = task.id === selectedTaskId;
              const badge = BADGE_STYLES[task.badgeColor] ?? BADGE_STYLES["bg-b"];
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    display: "flex", gap: "8px", padding: "10px", borderRadius: "8px",
                    marginBottom: "4px", cursor: "pointer",
                    background: isActive ? isDark ? "#2a2a36" : "#f0f0f0" : "transparent",
                    border: `1px solid ${isActive ? isDark ? "#3a3a42" : "#d0d0d0" : "transparent"}`,
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: task.avatar.bg, color: task.avatar.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: 600, flexShrink: 0
                  }}>
                    {task.avatar.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: isDark ? "#fff" : "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.code}
                    </div>
                    <div style={{ fontSize: "10px", color: isDark ? "#666" : "#999", marginTop: "2px" }}>
                      {task.due}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Task Detail */}
          {selectedTask && (
            <div style={{ padding: "16px", overflowY: "auto" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#fff" : "#000", marginBottom: "12px" }}>
                {selectedTask.code} <span style={{
                  fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                  borderRadius: "6px", background: BADGE_STYLES[selectedTask.badgeColor]?.bg,
                  color: BADGE_STYLES[selectedTask.badgeColor]?.color, marginLeft: "8px"
                }}>{selectedTask.badge}</span>
              </div>
              <div style={{ fontSize: "12px", color: isDark ? "#666" : "#999", lineHeight: 1.6 }}>
                <p><strong>Module:</strong> {selectedTask.name}</p>
                <p><strong>Due:</strong> {selectedTask.due}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
