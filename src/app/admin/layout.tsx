import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/layouts/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the original (pre-rewrite) pathname forwarded by proxy.ts.
  // /login on the admin subdomain must remain public.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
