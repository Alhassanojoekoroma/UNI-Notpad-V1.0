import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "LECTURER", "ADMIN"]),
  studentId: z.string().optional(),
  accessCode: z.string().optional(),
  referralCode: z.string().optional(),
});

export const roleSetupSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required"),
  semester: z.number().int().min(1).max(12),
  programId: z.string().min(1, "Program is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RoleSetupInput = z.infer<typeof roleSetupSchema>;
