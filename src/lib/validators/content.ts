import { z } from "zod/v4";

export const contentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  facultyId: z.string().min(1),
  semester: z.number().int().min(1),
  programId: z.string().optional(),
  module: z.string().min(1, "Module is required"),
  moduleCode: z.string().optional(),
  contentType: z.enum([
    "LECTURE_NOTES",
    "ASSIGNMENT",
    "TIMETABLE",
    "TUTORIAL",
    "PROJECT",
    "LAB",
    "OTHER",
  ]),
  tutorialLink: z.string().url().optional(),
});

export const contentUpdateSchema = contentUploadSchema.partial();

export const contentRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedbackText: z.string().optional(),
});
