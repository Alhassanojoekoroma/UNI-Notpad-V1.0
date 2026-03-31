import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.appSettings.findFirst();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              U
            </div>
            <span>{settings?.universityName ?? "UniNotepad"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/login" />}>
              Login
            </Button>
            <Button render={<Link href="/register" />}>
              Register
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container mx-auto flex items-center justify-center gap-4 px-4 py-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <span aria-hidden="true">&middot;</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span aria-hidden="true">&middot;</span>
          <Link href="/conduct" className="hover:underline">
            Code of Conduct
          </Link>
        </div>
      </footer>
    </div>
  );
}
