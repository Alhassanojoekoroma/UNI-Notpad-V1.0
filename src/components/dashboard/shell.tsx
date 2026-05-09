"use client";

import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Page Content - includes its own navigation */}
      {children}
    </div>
  );
}
