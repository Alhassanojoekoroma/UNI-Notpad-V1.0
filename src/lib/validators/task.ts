import { z } from "zod/v4";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  deadline: z.coerce.date().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const taskInviteSchema = z.object({
  inviteeEmail: z.email("Invalid email address"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskInviteInput = z.infer<typeof taskInviteSchema>;
