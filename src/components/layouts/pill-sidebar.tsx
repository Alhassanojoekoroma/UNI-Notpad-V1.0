"use client";

import Link from "next/link";
import { getNavByRole, UserRole } from "@/lib/navigation.config";

interface PillSidebarProps {
  role: UserRole;
  pathname: string;
}

/**
 * PillSidebar — fixed left icon-only sidebar.
 * Used by all three portals (Student / Lecturer / Admin).
 * Icons are 20px, buttons are 40px — compact and responsive.
 */
export function PillSidebar({ role, pathname }: PillSidebarProps) {
  const navItems = getNavByRole(role);

  const logoHref = "/dashboard";

  return (
    <nav
      style={{
        width: "72px",
        minWidth: "72px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "12px 0 12px",
        background: "#0d0d12",
        borderRight: "1px solid #1a1a22",
        position: "relative",
        zIndex: 10,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── Logo Bubble ── */}
      <Link
        href={logoHref}
        title="Home"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "#6fcf2e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 12px rgba(111,207,46,.40)",
          cursor: "pointer",
          flexShrink: 0,
          marginBottom: "6px",
          transition: "box-shadow 0.15s",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 18px rgba(111,207,46,.60)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 2px 12px rgba(111,207,46,.40)";
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "22px", height: "22px" }}
        >
          <path d="M12 3C9 7 5 8.5 5 13a7 7 0 0014 0c0-4.5-4-6-7-10z" />
          <path d="M12 13v4M9.5 15.5l2.5-2.5 2.5 2.5" />
        </svg>
      </Link>

      {/* ── Dark Pill Container ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          background: "#1c1c1e",
          borderRadius: "34px",
          padding: "10px 8px",
          flex: 1,
          overflowY: "auto",
          maxHeight: "calc(100vh - 130px)",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.title}
              style={{
                width: "40px",
                height: "40px",
                minHeight: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                textDecoration: "none",
                transition: "background 0.15s",
                background: isActive ? "#3a3a3c" : "#2c2c2e",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "#3a3a3c";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "#2c2c2e";
              }}
            >
              <item.icon
                size={18}
                strokeWidth={2}
                style={{
                  stroke: isActive ? "#ffffff" : "#8e8e93",
                  fill: "none",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  flexShrink: 0,
                }}
              />
            </Link>
          );
        })}
      </div>

      {/* ── Support Button ── */}
      <div
        style={{
          width: "40px",
          height: "40px",
          minHeight: "40px",
          borderRadius: "50%",
          background: "#f0f0f2",
          border: "1px solid #e0e0e4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: "4px",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#e4e4e8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#f0f0f2";
        }}
        title="Support"
        onClick={() => window.open("mailto:support@uninotepad.com")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "17px", height: "17px" }}
        >
          <path d="M3 18v-4a9 9 0 1118 0v4" />
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
          <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
        </svg>
      </div>
    </nav>
  );
}
