"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/use-session";
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
import { getNavByRole, type UserRole } from "@/lib/navigation.config";
import { USER_ROLE_LABELS } from "@/lib/constants";

/**
 * Top navigation.
 *
 * Tabs are derived from `navigation.config` rather than being a second,
 * hand-maintained copy of the same list. The duplicate copy had already drifted:
 * it still offered lecturers an "Assessments" tab pointing at a page whose API
 * never existed.
 *
 * Paths are written without a role prefix on purpose. `proxy.ts` rewrites
 * `admin.example.org/users` to `/admin/users`, and the browser URL stays
 * `/users`, so linking to `/admin/users` from the admin subdomain would rewrite
 * to `/admin/admin/users` and 404.
 */
export function DashboardTopNav() {
  const { user } = useSession();
  const pathname = usePathname();

  const role = (user?.role as UserRole | undefined) ?? "STUDENT";
  const navItems = getNavByRole(role);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  return (
    <header className="flex min-h-[52px] shrink-0 flex-nowrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:px-4">
      {/* Tab strip — scrolls horizontally instead of wrapping or overflowing */}
      <nav
        aria-label="Section navigation"
        className="no-scrollbar hidden shrink items-center gap-0.5 overflow-x-auto rounded-full bg-muted/50 p-1 sm:flex"
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] transition-colors ${
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "font-normal text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* On mobile the tab strip is replaced by the bottom bar, so show context */}
      <span className="text-sm font-semibold sm:hidden">UniNotepad</span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <span className="rounded-full bg-primary/10 px-2.5 py-[3px] text-[10px] font-semibold text-primary">
          {USER_ROLE_LABELS[role]}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-md border border-border bg-muted/50 hover:bg-muted"
          render={<Link href="/notifications" aria-label="Notifications" />}
        >
          <Bell className="size-3.5 stroke-muted-foreground stroke-[1.5]" aria-hidden="true" />
        </Button>

        <div className="origin-right scale-75">
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="size-7 shrink-0 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-7">
              <AvatarImage src={user?.image || ""} alt="" />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mt-2 w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {user?.name || "User"}
                  </p>
                  <p className="truncate text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              render={<Link href="/settings" />}
            >
              <UserIcon className="mr-2 size-4" aria-hidden="true" />
              Profile settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              // `signOut()` posts with the CSRF token. Navigating to
              // /api/auth/signout instead only rendered Auth.js's own
              // confirmation page.
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 size-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
