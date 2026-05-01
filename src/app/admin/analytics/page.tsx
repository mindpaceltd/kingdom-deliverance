import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics | Dashboard",
  description: "Website traffic and performance analysis.",
};

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
