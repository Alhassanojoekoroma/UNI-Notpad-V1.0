import { z } from "zod";

const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Invalid email address"),
);

/**
 * Password policy. Length is the dominant factor for offline-cracking
 * resistance, so the minimum is raised to 10 rather than layering on
 * composition rules that push users toward predictable substitutions.
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200, "Password must be at most 200 characters");

/**
 * Student IDs are institution-defined (see `AppSettings.studentIdPattern`), so
 * only shape is enforced here; the configured pattern is checked server-side by
 * `assertStudentIdMatchesPolicy`.
 */
export const studentIdSchema = z
  .string()
  .trim()
  .min(3, "Student ID is too short")
  .max(32, "Student ID is too long")
  .regex(
    /^[A-Za-z0-9/-]+$/,
    "Student ID may only contain letters, numbers, hyphens and slashes",
  );

export const loginSchema = z.object({
  // Login keeps the 8-character floor so accounts created under the previous
  // policy can still sign in; the strength gate lives on registration/reset.
  email: normalizedEmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  portal: z.enum(["STUDENT", "LECTURER", "ADMIN"]).optional(),
});

/**
 * Public registration.
 *
 * `role` is deliberately absent: this endpoint only ever creates STUDENT
 * accounts. Accepting a client-supplied role previously allowed anyone to
 * self-assign LECTURER. Lecturer accounts are provisioned through
 * `lecturerRedemptionSchema` with an admin-issued single-use code.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: normalizedEmailSchema,
  password: passwordSchema,
  studentId: studentIdSchema,
  facultyId: z.string().min(1, "Faculty is required"),
  programId: z.string().min(1, "Program is required"),
  semester: z.coerce
    .number()
    .int("Semester must be a whole number")
    .min(1, "Semester is required")
    .max(12, "Semester is out of range"),
  referralCode: z.string().trim().max(32).optional(),
  termsAccepted: z.literal(true, {
    message: "You must accept the Terms of Service",
  }),
  privacyAccepted: z.literal(true, {
    message: "You must accept the Privacy Policy",
  }),
});

/** Lecturer self-provisioning with an admin-issued single-use access code. */
export const lecturerRedemptionSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: normalizedEmailSchema,
  password: passwordSchema,
  accessCode: z
    .string()
    .trim()
    .min(6, "Access code is required")
    .max(64, "Access code is too long"),
  termsAccepted: z.literal(true, {
    message: "You must accept the Terms of Service",
  }),
  privacyAccepted: z.literal(true, {
    message: "You must accept the Privacy Policy",
  }),
});

/** Post-OAuth profile completion. Students only — see `/api/users/setup`. */
export const roleSetupSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required"),
  semester: z.coerce.number().int().min(1).max(12),
  programId: z.string().min(1, "Program is required"),
  studentId: studentIdSchema,
});

export const forgotPasswordSchema = z.object({
  email: normalizedEmailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Invalid reset token").max(256),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LecturerRedemptionInput = z.infer<typeof lecturerRedemptionSchema>;
export type RoleSetupInput = z.infer<typeof roleSetupSchema>;
