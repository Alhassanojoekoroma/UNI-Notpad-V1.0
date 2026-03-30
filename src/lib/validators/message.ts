import { z } from "zod/v4";

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message body is required").max(5000),
});

export const reportMessageSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ReportMessageInput = z.infer<typeof reportMessageSchema>;
