"use client";

import Link from "next/link";
import { ModuleList } from "@/components/forum/module-list";

export default function ForumPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discussion Forum</h1>
        <Link
          href="/conduct"
          target="_blank"
          className="text-sm text-muted-foreground hover:underline"
        >
          Code of Conduct
        </Link>
      </div>
      <ModuleList />
    </div>
  );
}
