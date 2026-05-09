"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RoleSidebarWrapper } from "@/components/layouts/role-sidebar-wrapper";
import { DashboardTopNav } from "@/components/dashboard/top-nav";

interface StudentShellProps {
  children: ReactNode;
  /** @deprecated activePath is now derived automatically via usePathname */
  activePath?: string;
  /** @deprecated studentName is now derived from session in DashboardTopNav */
  studentName?: string;
}

/**
 * StudentShell — wraps all student pages with the shared sidebar + top nav.
 * Uses the same RoleSidebarWrapper and DashboardTopNav as Admin/Lecturer shells
 * so all three portals have a consistent look and the nav is always connected.
 */
export function StudentShell({ children }: StudentShellProps) {
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
      {/* Role-aware Pill Sidebar — auto-detects STUDENT role from session */}
      <RoleSidebarWrapper role="STUDENT" />

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

// ─── Backwards-compat named exports ──────────────────────────────────────────
// These were used by some pages directly — re-export as no-ops / stubs so
// the build doesn't break while we migrate.
export { StudentShell as StudentPillSidebar };
export { StudentShell as StudentTopNav };
