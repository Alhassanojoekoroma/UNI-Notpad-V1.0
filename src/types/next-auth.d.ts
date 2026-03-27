import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    facultyId: string | null;
    semester: number | null;
    programId: string | null;
    studentId: string | null;
  }
  interface Session {
    user: User & { id: string };
  }
}
