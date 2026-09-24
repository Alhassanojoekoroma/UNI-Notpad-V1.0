"use client";

import { ReactNode } from "react";
import { AppShell } from "@/components/layouts/app-shell";

interface StudentShellProps {
  children: ReactNode;
}

export function StudentShell({ children }: StudentShellProps) {
  return <AppShell role="STUDENT">{children}</AppShell>;
}
