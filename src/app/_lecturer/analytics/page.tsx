import { AnalyticsDashboard } from "@/components/lecturer/analytics-dashboard";

export default function ContentAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track how students engage with your content
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
