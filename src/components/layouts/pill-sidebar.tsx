"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getNavByRole, type UserRole, type NavItem } from "@/lib/navigation.config";
import { cn } from "@/lib/utils";

interface PillSidebarProps {
  role: UserRole;
  pathname: string;
}

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@uninotepad.com";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

/**
 * Primary navigation for all three portals.
 *
 * Two behaviours changed here:
 *
 * 1. Colours come from theme tokens instead of hardcoded hex values in inline
 *    `style` objects. The previous `#0d0d12` / `#1c1c1e` / `#2c2c2e` made the
 *    sidebar permanently dark, so `next-themes` light mode and the admin theme
 *    settings had no effect on it.
 *
 * 2. It is responsive. It was a fixed 72px rail at every breakpoint with
 *    `height: 100vh` — 22% of a 320px viewport, permanently, with no way to
 *    collapse it. Below `md` it is now a bottom bar, which is also where thumbs
 *    actually reach on a phone.
 */
export function PillSidebar({ role, pathname }: PillSidebarProps) {
  const navItems = getNavByRole(role);

  return (
    <>
      {/* ── Desktop: vertical icon rail ── */}
      <nav
        aria-label="Main navigation"
        className="z-10 hidden h-dvh w-[72px] shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-3 md:flex"
      >
        <Link
          href="/dashboard"
          title="Home"
          aria-label="Home"
          className="mb-1.5 grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[22px]"
            aria-hidden="true"
          >
            <path d="M12 3C9 7 5 8.5 5 13a7 7 0 0014 0c0-4.5-4-6-7-10z" />
            <path d="M12 13v4M9.5 15.5l2.5-2.5 2.5 2.5" />
          </svg>
        </Link>

        <ul className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto rounded-[34px] bg-sidebar-accent px-2 py-2.5">
          {navItems.map((item) => (
            <li key={item.id}>
              <NavIcon item={item} active={isActive(pathname, item.href)} />
            </li>
          ))}
        </ul>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          title="Support"
          aria-label="Contact support"
          className="mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LifeBuoy className="size-[17px]" aria-hidden="true" />
        </a>
      </nav>

      {/* ── Mobile: bottom bar ──
          Horizontally scrollable so a long nav degrades by scrolling rather
          than by hiding destinations. `pb-[env(safe-area-inset-bottom)]` keeps
          it clear of the iOS home indicator. */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex items-center gap-1 overflow-x-auto px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.id} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // 56px wide keeps the touch target at/above the 44px minimum.
                    "flex w-14 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="w-full truncate text-center">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.title}
      aria-label={item.title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "bg-sidebar-accent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
    </Link>
  );
}
