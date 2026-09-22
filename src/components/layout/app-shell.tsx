import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Layers, BookOpen, Briefcase, FolderKanban, Building2, Settings, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/workspaces", label: "CV Workspaces", icon: Layers },
  { to: "/achievements", label: "Achievements", icon: BookOpen },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/career", label: "Career", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-l-primary bg-accent text-accent-foreground"
                : "border-l-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function BrandMark() {
  return (
    <div>
      <p className="font-semibold text-lg tracking-tight">BMS</p>
      <p className="text-xs text-muted-foreground">Career Content Library</p>
    </div>
  );
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      (previouslyFocused ?? menuButtonRef.current)?.focus();
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile-only sticky top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileNavOpen(true)}
          className="-ml-1.5 rounded-md p-1.5 text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold">BMS</p>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          aria-hidden="true"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-black/40 md:hidden motion-reduce:transition-none"
        />
      )}

      {/* Mobile off-canvas drawer */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!mobileNavOpen}
        // Stays mounted (so the slide transform can animate) but is fully
        // removed from the tab order and accessibility tree while closed —
        // `inert` isn't in this React version's DOM typings yet, hence the cast.
        {...(!mobileNavOpen ? ({ inert: "" } as Record<string, string>) : {})}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card px-3 py-4 transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between px-2 mb-6">
          <BrandMark />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNav}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavList onNavigate={closeMobileNav} />
      </div>

      {/* Desktop persistent sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col border-r border-border bg-card px-3 py-4">
        <div className="px-2 mb-6">
          <BrandMark />
        </div>
        <NavList />
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="container max-w-6xl py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
