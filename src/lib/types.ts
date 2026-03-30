import type {
  UserRole,
  Task,
  TaskInvitation,
  Schedule,
  Content,
  ContentRating,
  Faculty,
  Program,
  Message,
  Notification,
  ContentFlag,
} from "@prisma/client";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SafeUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  facultyId: string | null;
  semester: number | null;
  programId: string | null;
  studentId: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  createdAt: Date;
};

export type TaskWithInvitations = Task & {
  invitations: TaskInvitation[];
};

export type ContentWithRelations = Content & {
  faculty: Faculty;
  program: Program | null;
  lecturer: { id: string; name: string | null; avatarUrl: string | null };
  ratings: ContentRating[];
  flags?: ContentFlag[];
};

export type MessageWithSender = Message & {
  sender: { id: string; name: string | null; avatarUrl: string | null };
};

export type MessageWithRecipient = Message & {
  recipient: { id: string; name: string | null; avatarUrl: string | null };
};

export type NotificationItem = Notification;

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  category: "content" | "tasks" | "schedule" | "messages" | "forum";
  href: string;
};

export type SearchResults = {
  content: SearchResultItem[];
  tasks: SearchResultItem[];
  schedule: SearchResultItem[];
  messages: SearchResultItem[];
  forum: SearchResultItem[];
};
