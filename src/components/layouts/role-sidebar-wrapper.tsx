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

  // Only show a placeholder if the role wasn't provided and the session is
  // still resolving. Themed tokens, not hardcoded hex, so it matches in light
  // mode too.
  if (!role && status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="hidden h-dvh w-[72px] shrink-0 animate-pulse border-r border-sidebar-border bg-sidebar md:block"
      />
    );
  }

  return <PillSidebar role={resolvedRole} pathname={pathname} />;
}
