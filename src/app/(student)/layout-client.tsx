"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StudentShell } from "@/components/layouts/student-shell";

export function StudentLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  return <StudentShell activePath={pathname}>{children}</StudentShell>;
}
