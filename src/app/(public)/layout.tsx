import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let universityName = "UniNotepad";
  try {
    const settings = await prisma.appSettings.findFirst();
    universityName = settings?.universityName ?? "UniNotepad";
  } catch {
    // DB unavailable (e.g. no internet / offline dev) — use default name
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f1ef]">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 w-full px-4 py-5 md:px-[60px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex h-[72px] items-center justify-between rounded-xl bg-white px-2 pr-4 shadow-sm md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <GraduationCap className="h-8 w-8 text-black" fill="currentColor" strokeWidth={1} />
              <span className="text-xl font-bold tracking-tight text-black">{universityName}</span>
            </Link>

            {/* Nav Links – hidden on mobile */}
            <nav className="hidden items-center gap-6 md:flex">
              {[
                { label: "Overview", href: "/#overview" },
                { label: "Curriculum", href: "/#curriculum" },
                { label: "Instructor", href: "/#instructor" },
                { label: "Testimonials", href: "/#testimonials" },
                { label: "Pricing", href: "/#curriculum" },
                { label: "FAQ", href: "/#faq" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-black transition-colors hover:text-[#5e41e4]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="hidden"><ThemeToggle /></div>
            </nav>

            {/* CTA */}
            <Button
              className="flex h-[48px] items-center gap-3 rounded-[8px] bg-[#5e41e4] px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
              render={<Link href="/register" />}
            >
              Get Started Free
              <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-white text-[#5e41e4]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">{children}</main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#f2f1ef] px-2 pb-2">
        <div className="rounded-2xl bg-black px-6 py-16 md:px-10 md:py-[88px]">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-[92px]">

            {/* Left column */}
            <div className="flex flex-col gap-12 lg:min-w-[240px]">
              {/* Avatars + rating */}
              <div className="flex items-center gap-4">
                <div className="relative h-[42px] w-[170px] shrink-0">
                  {(["#5e41e4", "#1a1a2e", "#0f3460", "#2d6a4f"] as const).map((bg, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-[42px] w-[42px] rounded-full border border-[#2b2b2b]"
                      style={{ left: `${i * 32}px`, background: bg }}
                    />
                  ))}
                  <div
                    className="absolute top-0 flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#2b2b2b] bg-white text-sm font-semibold text-[#080808]"
                    style={{ left: "128px" }}
                  >
                    4K+
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#eab308]">★★★★★</span>
                  <p className="text-sm text-[#ededed]">Join 4,000+ Students</p>
                </div>
              </div>

              {/* Brand */}
              <div className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-2 no-underline">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5e41e4]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-white">{universityName}</span>
                </Link>
                <p className="max-w-[324px] text-[18px] leading-relaxed text-white opacity-85">
                  Here's everything you need to know before you start your journey with {universityName}.
                </p>
              </div>
            </div>

            {/* Right columns */}
            <div className="flex flex-col gap-12 sm:flex-row lg:flex-1 lg:justify-end lg:gap-[128px]">
              <div className="flex flex-col gap-4">
                <span className="text-[18px] text-[#c7cbfe]">Links</span>
                {[
                  { label: "Overview", href: "/#overview" },
                  { label: "Modules", href: "/#curriculum" },
                  { label: "Creator", href: "/#instructor" },
                  { label: "Testimonials", href: "/#testimonials" },
                  { label: "FAQ", href: "/#faq" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="text-base text-white no-underline hover:opacity-70 transition-opacity">
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[18px] text-[#c7cbfe]">Legal</span>
                <Link href="/privacy" className="text-base text-white hover:opacity-70 transition-opacity">Privacy Policy</Link>
                <Link href="/terms" className="text-base text-white hover:opacity-70 transition-opacity">Terms of Service</Link>
                <Link href="/conduct" className="text-base text-white hover:opacity-70 transition-opacity">Code of Conduct</Link>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[18px] text-[#c7cbfe]">Connect</span>
                <Link href="https://github.com/uninotepad" target="_blank" rel="noopener noreferrer" className="text-base text-white hover:opacity-70 transition-opacity">GitHub</Link>
                <Link href="https://x.com/" target="_blank" rel="noopener noreferrer" className="text-base text-white hover:opacity-70 transition-opacity">X (Twitter)</Link>
                <Link href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-base text-white hover:opacity-70 transition-opacity">Facebook</Link>
                <Link href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="text-base text-white hover:opacity-70 transition-opacity">YouTube</Link>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}