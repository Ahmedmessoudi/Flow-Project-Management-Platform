import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import UserManagement from "./pages/UserManagement";
import OrganizationManagement from "./pages/OrganizationManagement";
import TaskManagement from "./pages/TaskManagement";
import ProjectManagement from "./pages/ProjectManagement";
import ClientOverview from "./pages/ClientOverview";
import ClientProjects from "./pages/ClientProjects";
import TeamMemberTasks from "./pages/TeamMemberTasks";
import TeamMemberCalendar from "./pages/TeamMemberCalendar";
import SystemSettings from "./pages/SystemSettings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();

  // Determine the appropriate home page based on user role
  const getHomeRoute = () => {
    if (!user) return '/';
    if (user.role === 'CLIENT') return '/client/overview';
    if (user.role === 'TEAM_MEMBER') return '/team-member/tasks';
    return '/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getHomeRoute()} replace /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      } />

      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute>
          <Team />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN']}>
          <UserManagement />
        </ProtectedRoute>
      } />

      <Route path="/organizations" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <OrganizationManagement />
        </ProtectedRoute>
      } />

      <Route path="/tasks-management" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER']}>
          <TaskManagement />
        </ProtectedRoute>
      } />

      <Route path="/projects-management" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER']}>
          <ProjectManagement />
        </ProtectedRoute>
      } />

      <Route path="/client/overview" element={
        <ProtectedRoute allowedRoles={['CLIENT']}>
          <ClientOverview />
        </ProtectedRoute>
      } />

      <Route path="/client/projects" element={
        <ProtectedRoute allowedRoles={['CLIENT']}>
          <ClientProjects />
        </ProtectedRoute>
      } />

      <Route path="/team-member/tasks" element={
        <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
          <TeamMemberTasks />
        </ProtectedRoute>
      } />

      <Route path="/team-member/calendar" element={
        <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
          <TeamMemberCalendar />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SystemSettings />
        </ProtectedRoute>
      } />

      <Route path="/reset-password" element={
        <ProtectedRoute>
          <ResetPassword />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
