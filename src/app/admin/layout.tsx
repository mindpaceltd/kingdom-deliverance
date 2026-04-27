import {
  LayoutDashboard,
  FileText,
  Video,
  Calendar,
  Users,
  Settings,
  LogOut,
  Images,
  FileCog,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex-shrink-0 border-r border-white/10 hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin">
            <span className="font-serif text-xl font-bold tracking-wider text-accent">KDC CMS</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink href="/admin" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <SidebarLink href="/admin/posts" icon={<FileText className="w-5 h-5" />} label="Posts & Blogs" />
          <SidebarLink href="/admin/sermons" icon={<Video className="w-5 h-5" />} label="Sermons" />
          <SidebarLink href="/admin/events" icon={<Calendar className="w-5 h-5" />} label="Events" />
          <SidebarLink href="/admin/media" icon={<Images className="w-5 h-5" />} label="Media Library" />
          <SidebarLink href="/admin/pages" icon={<FileCog className="w-5 h-5" />} label="Pages Manager" />
          <SidebarLink href="/admin/users" icon={<Users className="w-5 h-5" />} label="Users" />
          <SidebarLink href="/admin/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>
        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between shrink-0">
          <h1 className="font-semibold text-lg text-primary">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent font-bold">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center space-x-3 px-3 py-2 rounded-md transition-colors hover:bg-white/10 text-white/80 hover:text-white">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
