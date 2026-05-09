"use client";

import { useState } from "react";

interface Task {
  id: string;
  code: string;
  name: string;
  due: string;
  badge: string;
  badgeColor: "bg-r" | "bg-y" | "bg-g" | "bg-b";
  avatar: {
    bg: string;
    text: string;
    initials: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
}

export function TaskList({ tasks, selectedTaskId, onSelectTask }: TaskListProps) {
  const badgeColors: Record<string, string> = {
    "bg-r": "#fde8e8",
    "bg-y": "#fef9e7",
    "bg-g": "#eafaf1",
    "bg-b": "#e8f4fd",
  };

  const badgeTextColors: Record<string, string> = {
    "bg-r": "#c0392b",
    "bg-y": "#b7770d",
    "bg-g": "#1e8449",
    "bg-b": "#1a6fa3",
  };

  return (
    <div style={{ background: "#fff", padding: "14px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>
          My Tasks
        </div>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "#f0f0f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="11"
            height="11"
            stroke="#888"
            fill="none"
            strokeLinecap="round"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        </div>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onSelectTask(task.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 9px",
            borderRadius: "9px",
            cursor: "pointer",
            marginBottom: "4px",
            border:
              selectedTaskId === task.id
                ? "1.5px solid #1a1a22"
                : "1.5px solid transparent",
            background:
              selectedTaskId === task.id ? "#fff" : "transparent",
            boxShadow:
              selectedTaskId === task.id
                ? "0 2px 8px rgba(0,0,0,.10)"
                : "none",
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            if (selectedTaskId !== task.id) {
              (e.currentTarget as HTMLElement).style.background = "#f5f5f8";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTaskId !== task.id) {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: "600",
              background: task.avatar.bg,
              color: task.avatar.text,
            }}
          >
            {task.avatar.initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "#222",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {task.name}
            </div>
            <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
              {task.due}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: "600",
                padding: "3px 8px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
                background: badgeColors[task.badgeColor],
                color: badgeTextColors[task.badgeColor],
              }}
            >
              {task.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
