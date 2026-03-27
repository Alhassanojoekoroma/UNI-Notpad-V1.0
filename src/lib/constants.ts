import type {
  ContentType,
  Priority,
  NotificationType,
  UserRole,
  TaskStatus,
  ContentStatus,
} from "@prisma/client";

export const BCRYPT_ROUNDS = 12;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  ADMIN: "Admin",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  LECTURE_NOTES: "Lecture Notes",
  ASSIGNMENT: "Assignment",
  TIMETABLE: "Timetable",
  TUTORIAL: "Tutorial",
  PROJECT: "Project",
  LAB: "Lab",
  OTHER: "Other",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  NEW_CONTENT: "New Content",
  MESSAGE_RECEIVED: "Message Received",
  TASK_DEADLINE: "Task Deadline",
  REFERRAL_BONUS: "Referral Bonus",
  CONTENT_FLAGGED: "Content Flagged",
  REPORT_RESOLVED: "Report Resolved",
  SYSTEM: "System",
};
