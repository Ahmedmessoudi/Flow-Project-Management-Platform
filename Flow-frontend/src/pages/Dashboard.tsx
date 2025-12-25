import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Settings,
  Building2,
  UserCog,
  ListTodo,
  Loader2,
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, DashboardStats, DashboardActivity, DashboardDeadline } from "@/services/dashboardService";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [deadlines, setDeadlines] = useState<DashboardDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData, deadlinesData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivities(),
        dashboardService.getUpcomingDeadlines(),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
      setDeadlines(deadlinesData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const role = stats?.role || 'UNKNOWN';

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              {role === 'SUPER_ADMIN' && "System-wide overview and statistics"}
              {role === 'ORG_ADMIN' && "Organization overview and team activity"}
              {role === 'PROJECT_MANAGER' && "Project progress and team performance"}
              {role === 'TEAM_MEMBER' && "Your tasks and upcoming deadlines"}
              {role === 'CLIENT' && "Project status and progress updates"}
              {role === 'UNKNOWN' && "Welcome to your dashboard"}
            </p>
          </div>
        </div>

        {/* Stats Cards - Role Specific */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {role === 'SUPER_ADMIN' && (
            <>
              <StatCard
                title="Total Organizations"
                value={stats?.totalOrganizations || 0}
                icon={Building2}
                subtitle="Registered organizations"
              />
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon={UserCog}
                subtitle="Registered users"
              />
              <StatCard
                title="Total Projects"
                value={stats?.totalProjects || 0}
                icon={FolderKanban}
                subtitle="Across all organizations"
              />
              <StatCard
                title="Active Organizations"
                value={stats?.activeOrganizations || 0}
                icon={CheckCircle2}
                iconColor="text-green-600"
                subtitle="Currently active"
              />
            </>
          )}

          {role === 'ORG_ADMIN' && (
            <>
              <StatCard
                title="Active Projects"
                value={stats?.activeProjects || 0}
                icon={FolderKanban}
                subtitle="In your organization"
              />
              <StatCard
                title="Team Members"
                value={stats?.teamMembers || 0}
                icon={Users}
                subtitle="Across all teams"
              />
              <StatCard
                title="Completed Tasks"
                value={stats?.completedTasks || 0}
                icon={CheckCircle2}
                subtitle={`of ${stats?.totalTasks || 0} total`}
              />
              <StatCard
                title="Overdue Tasks"
                value={stats?.overdueTasks || 0}
                icon={AlertCircle}
                iconColor="text-destructive"
                subtitle="Requires attention"
              />
            </>
          )}

          {role === 'PROJECT_MANAGER' && (
            <>
              <StatCard
                title="Active Projects"
                value={stats?.activeProjects || 0}
                icon={FolderKanban}
                subtitle={`of ${stats?.totalProjects || 0} managed`}
              />
              <StatCard
                title="Team Members"
                value={stats?.teamMembers || 0}
                icon={Users}
                subtitle="In your projects"
              />
              <StatCard
                title="Tasks Completed"
                value={stats?.completedTasks || 0}
                icon={CheckCircle2}
                subtitle={`${stats?.inProgressTasks || 0} in progress`}
              />
              <StatCard
                title="Overdue Tasks"
                value={stats?.overdueTasks || 0}
                icon={AlertCircle}
                iconColor="text-destructive"
                subtitle="Requires attention"
              />
            </>
          )}

          {role === 'TEAM_MEMBER' && (
            <>
              <StatCard
                title="Assigned Tasks"
                value={stats?.assignedTasks || 0}
                icon={ListTodo}
                subtitle="Total assigned to you"
              />
              <StatCard
                title="In Progress"
                value={stats?.inProgressTasks || 0}
                icon={Clock}
                subtitle="Currently working on"
              />
              <StatCard
                title="Completed"
                value={stats?.completedTasks || 0}
                icon={CheckCircle2}
                subtitle="Tasks finished"
              />
              <StatCard
                title="Due Soon"
                value={stats?.dueSoon || 0}
                icon={AlertCircle}
                iconColor="text-yellow-600"
                subtitle="Within 7 days"
              />
            </>
          )}

          {role === 'CLIENT' && (
            <>
              <StatCard
                title="Active Projects"
                value={stats?.activeProjects || 0}
                icon={FolderKanban}
                subtitle="Projects you're involved in"
              />
              <StatCard
                title="Total Tasks"
                value={stats?.totalTasks || 0}
                icon={ListTodo}
                subtitle="Across all projects"
              />
              <StatCard
                title="Completed"
                value={stats?.completedTasks || 0}
                icon={CheckCircle2}
                subtitle="Tasks finished"
              />
              <StatCard
                title="Completion Rate"
                value={stats?.completionRate || '0%'}
                icon={TrendingUp}
                subtitle="Overall progress"
              />
            </>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {(role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'PROJECT_MANAGER') && (
              <TabsTrigger value="team">Team</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    ) : (
                      activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Tasks due in the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deadlines.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    ) : (
                      deadlines.map((deadline, index) => (
                        <div key={index} className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium">{deadline.task}</p>
                            <p className="text-xs text-muted-foreground">{deadline.project}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(deadline.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link to="/projects">
                    <Button variant="outline">
                      <FolderKanban className="w-4 h-4 mr-2" />
                      View Projects
                    </Button>
                  </Link>
                  <Link to="/tasks">
                    <Button variant="outline">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      View Tasks
                    </Button>
                  </Link>
                  {(role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'PROJECT_MANAGER') && (
                    <Link to="/team">
                      <Button variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        View Team
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Project List</CardTitle>
                <CardDescription>Manage your active projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <Link to="/projects" className="text-primary hover:underline">
                    Go to Projects page
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
                <CardDescription>View and manage all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <Link to="/tasks" className="text-primary hover:underline">
                    Go to Tasks page
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>Manage your team members</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <Link to="/team" className="text-primary hover:underline">
                    Go to Team page
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Reusable Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  subtitle: string;
  iconColor?: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle, iconColor = "text-primary" }: StatCardProps) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {subtitle}
      </p>
    </CardContent>
  </Card>
);

export default Dashboard;
