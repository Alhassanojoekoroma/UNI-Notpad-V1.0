"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  facultyId: string | null;
  semester: number | null;
  programId: string | null;
  studentId: string | null;
};

export function useSession() {
  const { data: session, status, update } = useNextAuthSession();

  return {
    user: session?.user as SessionUser | undefined,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status,
    update,
  };
}
