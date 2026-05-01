import { Metadata } from "next";
import { TestimoniesManager } from "@/components/admin/testimonies/testimonies-manager";

export const metadata: Metadata = {
  title: "Admin | Testimonies",
  description: "Manage submitted testimonies.",
};

export default function AdminTestimoniesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Testimonies</h2>
      </div>
      <TestimoniesManager />
    </div>
  );
}
