import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Video, Calendar } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-primary">Overview</h2>
        <p className="text-muted-foreground">Welcome back, Admin. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Posts" value="24" icon={<FileText className="w-5 h-5 text-accent" />} />
        <StatCard title="Total Sermons" value="156" icon={<Video className="w-5 h-5 text-accent" />} />
        <StatCard title="Upcoming Events" value="3" icon={<Calendar className="w-5 h-5 text-accent" />} />
        <StatCard title="Registered Users" value="1,245" icon={<Users className="w-5 h-5 text-accent" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-primary">The Power of Prayer Part {i}</p>
                    <p className="text-sm text-muted-foreground">Published on April 20, 2026</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Published</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sermons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-primary">Faith in Action - Week {i}</p>
                    <p className="text-sm text-muted-foreground">Preached on April 19, 2026</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Video</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}
