"use client";

import { useState } from "react";

// ─── LECTURER NAV ITEMS ────────────────────────────────────
const LECTURER_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/lecturer/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    label: "Content",
    href: "/lecturer/content",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v3M16 2v3M3 9h18"/>
      </svg>
    ),
  },
  {
    label: "Assessments",
    href: "/lecturer/assessments",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    label: "Attendance",
    href: "/lecturer/attendance",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/><circle cx="17" cy="8" r="2.5"/><path d="M21 20c0-2.76-1.79-5-4-5.5"/>
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/lecturer/analytics",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18M5 20V14M9 20V8M13 20v-6M17 20V4"/>
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/lecturer/messages",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/lecturer/settings",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

function LecturerPillSidebar({ activePath = "/lecturer/dashboard" }: { activePath?: string }) {
  return (
    <nav style={{
      width: "72px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "16px 0",
      background: "#0d0d12",
      borderRight: "1px solid #1a1a22",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        width: "46px", height: "46px", borderRadius: "50%",
        background: "#6fcf2e",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 14px rgba(111,207,46,.40)",
        cursor: "pointer", flexShrink: 0, marginBottom: "2px",
      }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3C9 7 5 8.5 5 13a7 7 0 0014 0c0-4.5-4-6-7-10z"/>
          <path d="M12 13v4M9.5 15.5l2.5-2.5 2.5 2.5"/>
        </svg>
      </div>

      {/* Dark pill container */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "5px", background: "#1c1c1e", borderRadius: "36px", padding: "10px 7px",
      }}>
        {LECTURER_NAV_ITEMS.slice(0, -1).map((item) => {
          const isActive = activePath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative", textDecoration: "none",
                background: isActive ? "#3a3a3c" : "#2c2c2e",
                color: isActive ? "#ffffff" : "#8e8e93",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "#333";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "#2c2c2e";
              }}
            >
              {item.icon}
            </a>
          );
        })}
      </div>

      {/* Support button (white, outside pill) */}
      <div style={{
        width: "44px", height: "44px", borderRadius: "50%",
        background: "#f0f0f2", border: "1px solid #e0e0e4",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, marginTop: "2px",
        transition: "background 0.15s",
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e4e4e8"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f2"; }}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-4a9 9 0 0118 0v4"/>
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z"/>
          <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/>
        </svg>
      </div>
    </nav>
  );
}

function LecturerTopNav({ lecturerName, isDark, setIsDark }: { lecturerName: string; isDark: boolean; setIsDark: (val: boolean) => void }) {
  const initials = lecturerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 18px", background: isDark ? "#0d0d12" : "#f5f5f5",
      borderBottom: `1px solid ${isDark ? "#1e1e28" : "#e0e0e0"}`, gap: "8px", flexShrink: 0,
    }}>
      {/* Logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div style={{
          width: "26px", height: "26px", background: isDark ? "#fff" : "#000", borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "11px", color: isDark ? "#000" : "#fff",
        }}>U</div>
        <span style={{ color: isDark ? "#fff" : "#000", fontSize: "13px", fontWeight: 600 }}>UniNotepad</span>
      </div>

      {/* Lecturer badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "2px",
        background: isDark ? "#1e2a14" : "#f0f8f0", borderRadius: "22px", padding: "4px 12px", flexShrink: 0,
      }}>
        <span style={{
          padding: "3px 0", borderRadius: "16px", fontSize: "11px",
          color: "#6fcf2e", fontWeight: 600,
        }}>Lecturer Account</span>
      </div>

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
        {/* Notifications */}
        <div 
          onClick={() => window.location.href = "/lecturer/messages"}
          style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDark ? "#1a1a22" : "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }} 
          title="View notifications"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#252530" : "#d0d0d0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#1a1a22" : "#e8e8e8"; }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        {/* Search */}
        <div 
          onClick={() => window.location.href = "/lecturer/search"}
          style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDark ? "#1a1a22" : "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }} 
          title="Search"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#252530" : "#d0d0d0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#1a1a22" : "#e8e8e8"; }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        {/* Theme Toggle */}
        <div 
          onClick={() => setIsDark(!isDark)}
          style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: isDark ? "#2a2440" : "#f0e5ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.3s",
          }} 
          title={isDark ? "Light mode" : "Dark mode"}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#3a3050" : "#e0d5ff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#2a2440" : "#f0e5ff"; }}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6fcf2e" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </div>
        {/* Profile */}
        <div 
          onClick={() => window.location.href = "/lecturer/profile"}
          style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: isDark ? "#2a2440" : "#f0e5ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 600, color: isDark ? "#a78bfa" : "#6fcf2e",
            cursor: "pointer", transition: "background 0.15s",
          }} 
          title="View profile"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#3a3050" : "#e0d5ff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "#2a2440" : "#f0e5ff"; }}
        >{initials}</div>
      </div>
    </div>
  );
}

export { LecturerPillSidebar, LecturerTopNav };
