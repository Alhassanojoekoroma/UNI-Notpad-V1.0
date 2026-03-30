"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data?: Notification[];
  unreadCount?: number;
};

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications?pageSize=20");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}
