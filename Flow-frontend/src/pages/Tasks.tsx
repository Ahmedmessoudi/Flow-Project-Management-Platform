import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, MessageSquare, Plus, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { taskService, Task, CreateTaskData } from "@/services/taskService";
import { projectService, Project } from "@/services/projectService";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Dialog states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Comments state
  const [comments, setComments] = useState<any[]>([]); // TaskComment type
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [newTask, setNewTask] = useState<CreateTaskData>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    estimatedHours: 0,
    projectId: 0,
    assignedToId: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setNewTask(prev => ({ ...prev, assignedToId: user.id }));
    }
  }, [user, isAddTaskOpen]); // Reset when opening dialog too

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        taskService.getTasksByUser(),
        projectService.getAllProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to load data", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.projectId) {
      toast({
        title: "Validation Error",
        description: "Title and Project are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskPayload = { ...newTask };
      // Ensure assignedToId is current user if not set (though it should be set by useEffect)
      if (!taskPayload.assignedToId && user?.id) {
        taskPayload.assignedToId = user.id;
      }

      if (taskPayload.dueDate) {
        taskPayload.dueDate = new Date(taskPayload.dueDate).toISOString();
      }

      await taskService.createTask(taskPayload);
      toast({ title: "Success", description: "Task created successfully" });
      setIsAddTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        estimatedHours: 0,
        projectId: 0,
        assignedToId: user?.id
      });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const openTaskDetail = async (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
    loadComments(task.id);
  };

  const loadComments = async (taskId: number) => {
    setLoadingComments(true);
    try {
      const data = await taskService.getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try {
      await taskService.addTaskComment(selectedTask.id, newComment);
      setNewComment("");
      loadComments(selectedTask.id);
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, commentCount: t.commentCount + 1 } : t));
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTask) return;
    try {
      await taskService.updateTaskStatus(selectedTask.id, status);
      toast({ title: "Updated", description: "Task status updated" });
      setIsTaskDetailOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await taskService.deleteTask(taskId);
      toast({ title: "Success", description: "Task deleted" });
      setIsTaskDetailOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent": return "bg-red-500 hover:bg-red-600";
      case "high": return "bg-orange-500 hover:bg-orange-600";
      case "medium": return "bg-blue-500 hover:bg-blue-600";
      case "low": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-500";
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { title: "To Do", id: "todo" },
    { title: "In Progress", id: "in_progress" },
    { title: "Review", id: "review" },
    { title: "Done", id: "completed" },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-2">
              Manage tasks assigned to you (and created by you) across all projects
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full gap-6 min-w-[1000px] pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-1 bg-muted/30 rounded-lg p-4 flex flex-col gap-4 min-w-[280px]">
                <div className="flex items-center justify-between font-semibold text-sm text-muted-foreground">
                  <span>{column.title}</span>
                  <Badge variant="secondary" className="rounded-full px-2">
                    {filteredTasks.filter(t => t.status === column.id).length}
                  </Badge>
                </div>

                <div className="flex-1 flex flex-col gap-3 min-h-[100px]">
                  {filteredTasks
                    .filter(t => t.status === column.id)
                    .map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => openTaskDetail(task)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                              {task.title}
                            </span>
                            <Badge className={`${getPriorityColor(task.priority)} text-white border-0 text-[10px] px-1.5 py-0 h-5`}>
                              {task.priority}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="truncate max-w-[100px]" title={task.projectName}>
                                {task.projectName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                              {task.commentCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{task.commentCount}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Link to={`/projects/${task.projectId}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                            View Project <ArrowRight className="w-3 h-3" />
                          </Link>
                        </CardContent>
                      </Card>
                    ))}

                  {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg text-sm text-muted-foreground/50">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Task Dialog */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task (Personal)</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select
                  value={newTask.projectId?.toString()}
                  onValueChange={(v) => setNewTask({ ...newTask, projectId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>

              {/* Assign To field removed for "My Tasks" - defaults to self */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Detail Dialog for "My Tasks" - simplified view */}
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</Badge>
                  <Select value={selectedTask.status} onValueChange={handleUpdateStatus}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <Link to={`/projects/${selectedTask.projectId}`}>
                      View Project <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>

                <div className="bg-muted/30 p-4 rounded-md text-sm">
                  {selectedTask.description || "No description"}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-3 rounded">
                  <div>
                    <span className="font-semibold block mb-1">Assignee</span>
                    <span className="text-muted-foreground">{selectedTask.assignedToName || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block mb-1">Due Date</span>
                    <span className="text-muted-foreground">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-3">
                    {comments.map(c => (
                      <div key={c.id} className="text-sm bg-muted/50 p-2 rounded">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-xs">{c.userName}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" onClick={handleAddComment}>
                      <Loader2 className={`w-4 h-4 ${loadingComments ? 'animate-spin' : 'hidden'}`} />
                      {!loadingComments && <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteTask(selectedTask.id)}>
                    Delete Task
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Tasks;
