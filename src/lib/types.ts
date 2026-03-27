import type { UserRole } from "@prisma/client";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SafeUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  facultyId: string | null;
  semester: number | null;
  programId: string | null;
  studentId: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  createdAt: Date;
};
