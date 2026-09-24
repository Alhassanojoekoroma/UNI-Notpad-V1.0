"use client";

import { ReactNode } from "react";
import { StudentShell } from "@/components/layouts/student-shell";

export function StudentLayoutClient({ children }: { children: ReactNode }) {
  // The shell derives the active path itself via usePathname, so this wrapper
  // exists only to keep the server layout free of client-only hooks.
  return <StudentShell>{children}</StudentShell>;
}
