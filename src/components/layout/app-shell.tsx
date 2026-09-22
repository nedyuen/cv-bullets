import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Layers, BookOpen, Briefcase, FolderKanban, Building2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/workspaces", label: "CV Workspaces", icon: Layers },
  { to: "/achievements", label: "Achievements", icon: BookOpen },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/career", label: "Career", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r bg-card px-3 py-4">
        <div className="px-2 mb-6">
          <p className="font-semibold text-lg">BMS</p>
          <p className="text-xs text-muted-foreground">Career Content Library</p>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container py-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
