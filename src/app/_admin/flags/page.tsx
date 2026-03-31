import { ContentFlags } from "@/components/admin/content-flags";

export default function ContentFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Flags</h1>
        <p className="text-muted-foreground">
          Review and resolve flagged content
        </p>
      </div>
      <ContentFlags />
    </div>
  );
}
