import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentTable } from "@/components/lecturer/content-table";

export default function ManageContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Content</h1>
          <p className="text-muted-foreground">
            View, edit, and manage your uploaded materials
          </p>
        </div>
        <Button render={<Link href="/upload" />}>
          <Plus className="mr-2 size-4" />
          Upload New
        </Button>
      </div>
      <ContentTable />
    </div>
  );
}
