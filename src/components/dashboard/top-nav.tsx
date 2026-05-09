"use client";

import Link from "next/link";
import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/use-session";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TabItem {
  label: string;
  href: string;
  active: boolean;
}

/** Derive the notification/messages href based on role/path */
function getMessagesHref(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/admin/messages";
  if (pathname.startsWith("/lecturer")) return "/lecturer/messages";
  return "/messages";
}

/** Tabs to show in the top nav per role */
function getTabsForPath(pathname: string, role?: string): TabItem[] {
  const isAdmin =
    role === "ADMIN" || pathname.startsWith("/admin");
  const isLecturer =
    role === "LECTURER" || pathname.startsWith("/lecturer");

  if (isAdmin) {
    return [
      { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" || pathname === "/" },
      { label: "Users", href: "/users", active: pathname.startsWith("/users") },
      { label: "Analytics", href: "/analytics", active: pathname.startsWith("/analytics") },
      { label: "Reports", href: "/reports", active: pathname.startsWith("/reports") },
      { label: "Flags", href: "/flags", active: pathname.startsWith("/flags") },
      { label: "Messages", href: "/messages", active: pathname.startsWith("/messages") },
      { label: "Codes", href: "/codes", active: pathname.startsWith("/codes") },
      { label: "Settings", href: "/settings", active: pathname.startsWith("/settings") },
    ];
  }

  if (isLecturer) {
    return [
      { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" || pathname === "/" },
      { label: "Upload", href: "/upload", active: pathname.startsWith("/upload") },
      { label: "Materials", href: "/content", active: pathname.startsWith("/content") },
      { label: "Assessments", href: "/assessments", active: pathname.startsWith("/assessments") || pathname.startsWith("/tasks") },
      { label: "Analytics", href: "/analytics", active: pathname.startsWith("/analytics") },
      { label: "Messages", href: "/messages", active: pathname.startsWith("/messages") },
      { label: "Settings", href: "/settings", active: pathname.startsWith("/settings") },
    ];
  }

  // Student
  return [
    { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { label: "Materials", href: "/content", active: pathname.startsWith("/content") },
    { label: "AI", href: "/ai", active: pathname.startsWith("/ai") },
    { label: "Tasks", href: "/tasks", active: pathname.startsWith("/tasks") },
    { label: "Schedule", href: "/schedule", active: pathname.startsWith("/schedule") },
    { label: "Forum", href: "/forum", active: pathname.startsWith("/forum") },
    { label: "Messages", href: "/messages", active: pathname.startsWith("/messages") },
    { label: "Settings", href: "/settings", active: pathname.startsWith("/settings") },
  ];
}

/** Role badge shown in the top nav */
function getRoleBadge(pathname: string, role?: string) {
  const isAdmin = role === "ADMIN" || pathname.startsWith("/admin");
  const isLecturer = role === "LECTURER" || pathname.startsWith("/lecturer");

  if (isAdmin) {
    return {
      label: "Admin",
      bg: "rgba(220,38,38,.15)",
      color: "#ef4444",
    };
  }
  if (isLecturer) {
    return {
      label: "Lecturer",
      bg: "rgba(111,207,46,.12)",
      color: "#6fcf2e",
    };
  }
  return {
    label: "Student",
    bg: "rgba(111,207,46,.10)",
    color: "#6fcf2e",
  };
}

export function DashboardTopNav() {
  const { user } = useSession();
  const pathname = usePathname();

  const role = user?.role as string | undefined;
  const tabs = getTabsForPath(pathname, role);
  const badge = getRoleBadge(pathname, role);
  const messagesHref = getMessagesHref(pathname);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border shrink-0 min-h-[52px] flex-nowrap overflow-x-auto gap-2">
      {/* Left: Scrollable tab strip */}
      <div className="flex items-center gap-0.5 bg-muted/50 rounded-full p-1 shrink overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-colors shrink-0 ${
              tab.active
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground font-normal hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Right: Role badge + icons + avatar */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {/* Role badge */}
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "16px",
            fontSize: "10px",
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            flexShrink: 0,
          }}
        >
          {badge.label}
        </span>

        {/* Notification bell */}
        <Link 
          href={pathname.startsWith("/admin") ? "/admin/notifications" : pathname.startsWith("/lecturer") ? "/lecturer/notifications" : "/notifications"} 
          title="Notifications" 
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-md bg-muted/50 border border-border hover:bg-muted flex-shrink-0"
          >
            <Bell className="w-3.5 h-3.5 stroke-muted-foreground stroke-[1.5]" />
          </Button>
        </Link>

        {/* Theme Toggle */}
        <div className="flex-shrink-0 scale-75 origin-right">
          <ThemeToggle />
        </div>

        {/* Avatar Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-7 h-7 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded-full outline-none">
            <Avatar className="w-7 h-7">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                let settingsHref = "/settings";
                if (pathname.startsWith("/admin")) settingsHref = "/admin/settings";
                if (pathname.startsWith("/lecturer")) settingsHref = "/lecturer/settings";
                window.location.href = settingsHref;
              }}
            >
              <div className="w-full flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => { window.location.href = "/api/auth/signout" }}
            >
              <div className="w-full flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
