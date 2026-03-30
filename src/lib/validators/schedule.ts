import { z } from "zod/v4";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern, "Use HH:mm format"),
  endTime: z.string().regex(timePattern, "Use HH:mm format"),
  subject: z.string().min(1, "Subject is required").max(200),
  location: z.string().max(200).optional(),
  type: z.enum(["lecture", "tutorial", "lab"]).optional(),
});

export const updateScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(timePattern, "Use HH:mm format").optional(),
  endTime: z.string().regex(timePattern, "Use HH:mm format").optional(),
  subject: z.string().min(1).max(200).optional(),
  location: z.string().max(200).nullable().optional(),
  type: z.enum(["lecture", "tutorial", "lab"]).nullable().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
