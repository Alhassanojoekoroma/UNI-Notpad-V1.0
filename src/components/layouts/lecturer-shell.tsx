"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LecturerSidebar } from "@/components/layouts/lecturer-sidebar";
import { StudentHeader } from "@/components/layouts/header";

export function LecturerShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LecturerSidebar />
      <SidebarInset>
        <StudentHeader />
        <main id="main-content" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
