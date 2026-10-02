import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { WorkspacesPage } from "@/pages/workspaces/WorkspacesPage";
import { WorkspaceDetailPage } from "@/pages/workspaces/WorkspaceDetailPage";
import { AchievementsPage } from "@/pages/achievements/AchievementsPage";
import { AchievementDetailPage } from "@/pages/achievements/AchievementDetailPage";
import { MasterViewsPage } from "@/pages/achievements/MasterViewsPage";
import { ApplicationsPage } from "@/pages/applications/ApplicationsPage";
import { ApplicationDetailPage } from "@/pages/applications/ApplicationDetailPage";
import { CareerPage } from "@/pages/career/CareerPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/achievements/:id" element={<AchievementDetailPage />} />
          <Route path="/master-views" element={<MasterViewsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
