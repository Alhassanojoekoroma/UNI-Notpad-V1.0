import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LecturerLayoutClient } from "./layout-client";

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "LECTURER") {
    redirect("/");
  }

  return <LecturerLayoutClient>{children}</LecturerLayoutClient>;
}
