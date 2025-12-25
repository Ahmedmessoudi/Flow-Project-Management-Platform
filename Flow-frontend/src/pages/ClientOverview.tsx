import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectService, Project } from "@/services/projectService";
import { taskService, Task } from "@/services/taskService";
import { FolderKanban, Clock, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const ClientOverview = () => {
  const { user } = useAuth();
  const [tasksInProgress, setTasksInProgress] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    tasksInProgress: 0,
    totalDocuments: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Load Projects
      const projectsData = await projectService.getAllProjects();
      const activeProjectsCount = projectsData.filter(p => p.isActive).length;

      // 2. Load Tasks in Progress across all projects
      let allTasks: Task[] = [];
      let docsCount = 0;

      // We use Promise.all to fetch tasks for all projects in parallel
      await Promise.all(projectsData.map(async (project) => {
        try {
          // Fetch tasks
          const tasks = await taskService.getTasksByProject(project.id);
          const inProgress = tasks.filter(t => t.status === "in_progress");
          // Add project name to task for display if not present
          const tasksWithProjectName = inProgress.map(t => ({ ...t, projectName: project.name }));
          allTasks = [...allTasks, ...tasksWithProjectName];

          // Fetch Docs (for stats)
          const docs = await projectService.getProjectDocuments(project.id);
          docsCount += docs.length;

        } catch (e) {
          console.error(`Failed to load data for project ${project.id}`, e);
        }
      }));

      setTasksInProgress(allTasks);
      setStats({
        activeProjects: activeProjectsCount,
        tasksInProgress: allTasks.length,
        totalDocuments: docsCount
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'Client'}</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Assigned to you
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasks in Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksInProgress}</div>
              <p className="text-xs text-muted-foreground">
                Currently being worked on
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Project Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Available for download
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks in Progress Table */}
        <div className="border rounded-lg bg-card">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium">Tasks In Progress</h3>
            <p className="text-sm text-muted-foreground">
              Real-time updates on active tasks across your projects
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasksInProgress.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No tasks currently in progress.
                  </TableCell>
                </TableRow>
              ) : (
                tasksInProgress.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {/* Navigate to Client Project Detail if we implement it, typically clients view projects in read-only */}
                      <Link to={`/projects/${task.projectId}`} className="hover:underline">
                        <Badge variant="outline" className="font-normal cursor-pointer">
                          {task.projectName}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignedToName || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientOverview;
