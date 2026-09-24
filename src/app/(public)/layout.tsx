import Link from "next/link";
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

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="truncate">{universityName}</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Public pages">
            {marketingUrl ? (
              <Button variant="ghost" render={<a href={marketingUrl} rel="noreferrer" />}>Website</Button>
            ) : null}
            <Button variant="ghost" render={<Link href="/login" />}>Sign in</Button>
            <Button render={<Link href="/register" />}>Create account</Button>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        {children}
      </main>

      <footer className="border-t bg-background px-4 py-6 text-sm text-muted-foreground sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{universityName} application</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/conduct" className="hover:text-foreground">Code of conduct</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
