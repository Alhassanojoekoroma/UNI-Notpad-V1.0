import { z } from "zod/v4";

export const userUpdateSchema = z.object({
  role: z.enum(["STUDENT", "LECTURER", "ADMIN"]).optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const settingsSchema = z.object({
  universityName: z.string().optional(),
  universityLogo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  domain: z.string().optional(),
  studentIdPattern: z.string().optional(),
  maxSemesters: z.number().int().min(1).optional(),
  geminiModel: z.string().optional(),
  geminiApiKey: z.string().optional(),
  elevenlabsApiKey: z.string().optional(),
  resendApiKey: z.string().optional(),
  monimeApiKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  cloudinaryCloudName: z.string().optional(),
  cloudinaryApiKey: z.string().optional(),
  cloudinaryApiSecret: z.string().optional(),
  freeQueriesPerDay: z.number().int().min(0).optional(),
  freeSuspensionHours: z.number().int().min(0).optional(),
  referralBonusTokens: z.number().int().min(0).optional(),
  tokenPackages: z.string().optional(),
  termsOfService: z.string().optional(),
  privacyPolicy: z.string().optional(),
  codeOfConduct: z.string().optional(),
  contentPolicy: z.string().optional(),
});

export const lecturerCodeSchema = z.object({
  lecturerName: z.string().min(1, "Lecturer name is required"),
  facultyId: z.string().optional(),
});

export const facultySchema = z.object({
  name: z.string().min(1, "Faculty name is required"),
  code: z.string().min(1, "Faculty code is required"),
});

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  code: z.string().min(1, "Program code is required"),
  facultyId: z.string().min(1, "Faculty is required"),
});

export const flagUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]),
  adminNotes: z.string().optional(),
  action: z.enum(["DISMISS", "REMOVE_CONTENT", "WARN_UPLOADER", "SUSPEND_UPLOADER"]).optional(),
});

export const reportUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]),
  adminNotes: z.string().optional(),
  actionTaken: z.enum(["DISMISS", "WARN", "SUSPEND", "BAN"]).optional(),
});

export const bulkMessageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
  recipientFilter: z.object({
    type: z.enum(["ALL", "ROLE", "FACULTY", "SEMESTER"]),
    role: z.enum(["STUDENT", "LECTURER", "ADMIN"]).optional(),
    facultyId: z.string().optional(),
    semester: z.number().int().optional(),
  }),
  preview: z.boolean().optional(),
});

const setupFacultySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  programs: z.array(
    z.object({
      name: z.string().min(1),
      code: z.string().min(1),
    })
  ).optional(),
});

export const setupWizardSchema = z.object({
  // University info
  universityName: z.string().min(1, "University name is required"),
  universityLogo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  // Admin account
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.email("Valid email is required"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  // Academic structure
  faculties: z.array(setupFacultySchema).min(1, "At least one faculty is required"),
  // Student ID format
  studentIdPattern: z.string().optional(),
  // API keys
  geminiApiKey: z.string().min(1, "Gemini API key is required"),
  resendApiKey: z.string().min(1, "Resend API key is required"),
  cloudinaryCloudName: z.string().min(1, "Cloudinary cloud name is required"),
  cloudinaryApiKey: z.string().min(1, "Cloudinary API key is required"),
  cloudinaryApiSecret: z.string().min(1, "Cloudinary API secret is required"),
  elevenlabsApiKey: z.string().optional(),
  monimeApiKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  // Policies
  termsOfService: z.string().optional(),
  privacyPolicy: z.string().optional(),
  codeOfConduct: z.string().optional(),
});
