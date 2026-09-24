"use client";

import { ReactNode } from "react";
import { AppShell } from "@/components/layouts/app-shell";

export function LecturerShell({ children }: { children: ReactNode }) {
  return <AppShell role="LECTURER">{children}</AppShell>;
}
