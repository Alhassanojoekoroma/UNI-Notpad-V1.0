"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Trash2, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("unread");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "NEW_CONTENT":
        return "bg-blue-50 border-blue-200";
      case "MESSAGE_RECEIVED":
        return "bg-purple-50 border-purple-200";
      case "TASK_DEADLINE":
        return "bg-red-50 border-red-200";
      case "REFERRAL_BONUS":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_CONTENT":
        return "📚";
      case "MESSAGE_RECEIVED":
        return "💬";
      case "TASK_DEADLINE":
        return "⏰";
      case "REFERRAL_BONUS":
        return "🎁";
      default:
        return "📢";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="size-8" />
          Notifications
        </h1>
        <p className="text-muted-foreground">
          Stay updated with your latest messages and alerts
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Badge variant="secondary">{notifications.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-4 size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-4 rounded-lg border p-4 transition-colors ${getNotificationColor(notification.type)} ${
                      !notification.read ? "border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}{" "}
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
