import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentLayoutClient } from "./layout-client";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  if (!session.user.facultyId) {
    redirect("/setup");
  }

  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
