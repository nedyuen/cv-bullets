import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { DashboardPage } from "@/pages/DashboardPage";
import { WorkspacesPage } from "@/pages/workspaces/WorkspacesPage";
import { WorkspaceDetailPage } from "@/pages/workspaces/WorkspaceDetailPage";
import { AchievementsPage } from "@/pages/achievements/AchievementsPage";
import { AchievementDetailPage } from "@/pages/achievements/AchievementDetailPage";
import { ApplicationsPage } from "@/pages/applications/ApplicationsPage";
import { ApplicationDetailPage } from "@/pages/applications/ApplicationDetailPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { CareerPage } from "@/pages/career/CareerPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/achievements/:id" element={<AchievementDetailPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
