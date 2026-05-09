import {
  LayoutDashboard,
  BookOpen,
  Bot,
  CheckSquare,
  Calendar,
  MessageSquare,
  MessageCircle,
  TrendingUp,
  Coins,
  Share2,
  Settings,
  BarChart3,
  Users,
  Upload,
  FileText,
  Flag,
  Code2,
  LucideIcon,
  Bell,
} from "lucide-react";

export type UserRole = "STUDENT" | "LECTURER" | "ADMIN";

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
}

/**
 * STUDENT NAVIGATION
 * All items accessible to students — hrefs must match actual route group paths
 */
export const STUDENT_NAV: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "View your dashboard",
  },
  {
    id: "content",
    title: "Course Materials",
    href: "/content",
    icon: BookOpen,
    description: "Browse course materials",
  },
  {
    id: "ai",
    title: "AI Assistant",
    href: "/ai",
    icon: Bot,
    description: "Study with AI",
  },
  {
    id: "tasks",
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    description: "Manage tasks",
  },
  {
    id: "schedule",
    title: "Schedule",
    href: "/schedule",
    icon: Calendar,
    description: "View schedule",
  },
  {
    id: "messages",
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    description: "Chat with peers",
  },
  {
    id: "forum",
    title: "Forum",
    href: "/forum",
    icon: MessageCircle,
    description: "Discussion forum",
  },
  {
    id: "progress",
    title: "Progress",
    href: "/progress",
    icon: TrendingUp,
    description: "Track progress",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account settings",
  },
];

/**
 * LECTURER NAVIGATION
 * Lecturer-specific pages with admin controls
 */
export const LECTURER_NAV: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "View dashboard",
  },
  {
    id: "upload",
    title: "Upload Content",
    href: "/upload",
    icon: Upload,
    description: "Upload course materials",
  },
  {
    id: "content",
    title: "My Content",
    href: "/content",
    icon: BookOpen,
    description: "Manage content",
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "View analytics",
  },
  {
    id: "assessments",
    title: "Assessments",
    href: "/assessments",
    icon: FileText,
    description: "Create assessments",
  },
  {
    id: "messages",
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    description: "Message students",
  },
  {
    id: "attendance",
    title: "Attendance",
    href: "/attendance",
    icon: CheckSquare,
    description: "Track attendance",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account settings",
  },
];

/**
 * ADMIN NAVIGATION
 * Admin system management pages — must match all admin/* routes
 */
export const ADMIN_NAV: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Admin dashboard",
  },
  {
    id: "users",
    title: "Users",
    href: "/users",
    icon: Users,
    description: "Manage users",
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "System analytics",
  },
  {
    id: "flags",
    title: "Flags",
    href: "/flags",
    icon: Flag,
    description: "Content flags",
  },
  {
    id: "messages",
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    description: "Bulk messaging",
  },
  {
    id: "codes",
    title: "Codes",
    href: "/codes",
    icon: Code2,
    description: "Lecturer codes",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System settings",
  },
];

/**
 * Get navigation items by role
 */
export function getNavByRole(role: UserRole): NavItem[] {
  switch (role) {
    case "STUDENT":
      return STUDENT_NAV;
    case "LECTURER":
      return LECTURER_NAV;
    case "ADMIN":
      return ADMIN_NAV;
    default:
      return STUDENT_NAV;
  }
}

/**
 * Get nav item by ID and role
 */
export function getNavItemById(role: UserRole, id: string): NavItem | undefined {
  const nav = getNavByRole(role);
  return nav.find((item) => item.id === id);
}

/**
 * Check if a path is active for a role
 */
export function isNavItemActive(pathname: string, role: UserRole): boolean {
  const nav = getNavByRole(role);
  return nav.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}
