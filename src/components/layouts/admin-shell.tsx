"use client";

import { ReactNode } from "react";
import { AppShell } from "@/components/layouts/app-shell";

export function AdminShell({ children }: { children: ReactNode }) {
  return <AppShell role="ADMIN">{children}</AppShell>;
}
