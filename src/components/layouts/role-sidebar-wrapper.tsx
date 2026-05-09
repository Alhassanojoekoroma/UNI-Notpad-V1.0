"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@/lib/navigation.config";
import { PillSidebar } from "./pill-sidebar";

/**
 * Role-aware Sidebar Wrapper
 * Extracts role from session and pathname, passes to PillSidebar
 */
export function RoleSidebarWrapper({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  let resolvedRole: UserRole = role || "STUDENT";

  if (!role) {
    if (session?.user?.role) {
      resolvedRole = session.user.role as UserRole;
    } else if (pathname.startsWith("/admin")) {
      resolvedRole = "ADMIN";
    } else if (pathname.startsWith("/lecturer")) {
      resolvedRole = "LECTURER";
    }
  }

  // Only show loading if role wasn't provided and session is still loading
  if (!role && status === "loading") {
    return (
      <nav
        style={{
          width: "72px",
          flexShrink: 0,
          background: "#0d0d12",
          borderRight: "1px solid #1a1a22",
          animation: "pulse 2s infinite",
        }}
      />
    );
  }

  return <PillSidebar role={resolvedRole} pathname={pathname} />;
}
