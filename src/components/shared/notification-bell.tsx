"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, BookOpen, MessageSquare, CheckSquare, Gift, Flag, AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  NEW_CONTENT: BookOpen,
  MESSAGE_RECEIVED: MessageSquare,
  TASK_DEADLINE: CheckSquare,
  REFERRAL_BONUS: Gift,
  CONTENT_FLAGGED: Flag,
  REPORT_RESOLVED: AlertCircle,
  SYSTEM: Bell,
};

const typeHrefs: Record<string, string> = {
  NEW_CONTENT: "/content",
  MESSAGE_RECEIVED: "/messages",
  TASK_DEADLINE: "/tasks",
  REFERRAL_BONUS: "/referrals",
  CONTENT_FLAGGED: "/content",
  REPORT_RESOLVED: "/settings",
  SYSTEM: "/dashboard",
};

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative size-8" />}>
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    router.push(typeHrefs[n.type] ?? "/dashboard");
                  }}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
