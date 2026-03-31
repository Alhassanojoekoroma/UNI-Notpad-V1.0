import { z } from "zod/v4";

export const createForumPostSchema = z.object({
  module: z.string().min(1, "Module is required"),
  facultyId: z.string().min(1),
  body: z.string().min(1, "Post body is required").max(10000),
  title: z.string().min(1).max(300).optional(),
  parentId: z.string().optional(),
});

export const reportForumPostSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
});
