import { z } from "zod/v4";

export const userUpdateSchema = z.object({
  role: z.enum(["STUDENT", "LECTURER", "ADMIN"]).optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const settingsSchema = z.object({
  universityName: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  domain: z.string().optional(),
  studentIdPattern: z.string().optional(),
  maxSemesters: z.number().int().min(1).optional(),
  geminiModel: z.string().optional(),
  freeQueriesPerDay: z.number().int().min(0).optional(),
  freeSuspensionHours: z.number().int().min(0).optional(),
  referralBonusTokens: z.number().int().min(0).optional(),
});

export const lecturerCodeSchema = z.object({
  lecturerName: z.string().min(1, "Lecturer name is required"),
  facultyId: z.string().optional(),
});
