"use client";

import { ReactNode } from "react";
import { RoleSidebarWrapper } from "@/components/layouts/role-sidebar-wrapper";
import { DashboardTopNav } from "@/components/dashboard/top-nav";

interface LecturerShellProps {
  children: ReactNode;
}

export function LecturerShell({ children }: LecturerShellProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        overflow: "hidden",
        background: "#0d0d12",
      }}
    >
      {/* Role-aware Pill Sidebar — auto-detects LECTURER role from session */}
      <RoleSidebarWrapper role="LECTURER" />

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Navigation */}
        <DashboardTopNav />

        {/* Page Content */}
        <div
          className="bg-background"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
