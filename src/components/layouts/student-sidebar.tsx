"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  CheckSquare,
  Calendar,
  MessageSquare,
  MessagesSquare,
  TrendingUp,
  Coins,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Course Materials", href: "/content", icon: BookOpen },
  { title: "AI Assistant", href: "/ai", icon: Bot },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Schedule", href: "/schedule", icon: Calendar },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Forum", href: "/forum", icon: MessagesSquare },
  { title: "Progress", href: "/progress", icon: TrendingUp },
  { title: "Tokens", href: "/tokens", icon: Coins },
  { title: "Referrals", href: "/referrals", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            U
          </div>
          <span className="font-semibold">UniNotepad</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-3 rounded-md p-2 text-left outline-hidden hover:bg-accent focus-visible:bg-accent"
          >
            <Avatar className="size-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User avatar"} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {user?.name ?? "Student"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
