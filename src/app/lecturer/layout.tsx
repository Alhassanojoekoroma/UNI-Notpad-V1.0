import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LecturerShell } from "@/components/layouts/lecturer-shell";

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "LECTURER") {
    redirect("/");
  }

  return <LecturerShell>{children}</LecturerShell>;
}
