"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Bot, Calendar, CheckSquare } from "lucide-react";

const actions = [
  { label: "Browse Materials", href: "/content", icon: BookOpen },
  { label: "AI Chat", href: "/ai", icon: Bot },
  { label: "View Schedule", href: "/schedule", icon: Calendar },
  { label: "My Tasks", href: "/tasks", icon: CheckSquare },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button key={action.href} variant="outline" render={<Link href={action.href} />}>
          <action.icon className="mr-2 size-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
