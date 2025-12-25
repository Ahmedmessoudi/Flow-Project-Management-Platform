import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Calendar as CalendarIcon,
    MessageSquare,
    Clock,
    Plus,
    MoreVertical,
    ArrowLeft,
    Users,
    Send,
    Trash2,
    AlertCircle,
    Lock,
    Search,
    Edit
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { projectService, Project } from "@/services/projectService";
import { taskService, Task, CreateTaskData, UpdateTaskData, TaskComment } from "@/services/taskService";
import { userService, User } from "@/services/userService";
import { api } from "@/lib/api";

const ProjectDetail = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const projectId = Number(id);

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog states
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Task form state
    const [taskForm, setTaskForm] = useState<CreateTaskData>({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        estimatedHours: 0,
        assignedToId: undefined,
        projectId: projectId,
    });

    // Comments state
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    // Drag and drop state
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const [projectData, tasksData] = await Promise.all([
                projectService.getProjectById(projectId),
                taskService.getTasksByProject(projectId)
            ]);

            setProject(projectData);
            setTasks(tasksData);

            // Fetch members based on project's organization
            if (projectData) {
                // Check embedded organization object or simple ID
                const orgId = projectData.organization?.id || projectData.organizationId;
                if (orgId) {
                    try {
                        const orgMembers = await api.get(`/api/organizations/${orgId}/members`);
                        const filteredMembers = (orgMembers || []).filter((m: any) => {
                            const roles: string[] = m.roles || [];
                            const orgRole: string | undefined = (m as any).organizationRole;
                            return roles.includes("TEAM_MEMBER") || roles.includes("PROJECT_MANAGER") || orgRole === "TEAM_MEMBER" || orgRole === "PROJECT_MANAGER";
                        });
                        setMembers(filteredMembers);
                    } catch (e) {
                        console.error("Failed to load members", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading project data:", error);
            toast({
                title: "Error",
                description: "Failed to load project details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === draggedTaskId ? { ...t, status: status as any } : t
        );
        setTasks(updatedTasks);
        setDraggedTaskId(null);

        try {
            await taskService.updateTaskStatus(draggedTaskId, status);
            toast({
                title: "Status Updated",
                description: `Task moved to ${status.replace("_", " ")}`,
            });
        } catch (error) {
            // Revert on failure
            loadProjectData();
            toast({
                title: "Error",
                description: "Failed to update task status",
                variant: "destructive",
            });
        }
    };

    const handleAddTask = async () => {
        try {
            if (!taskForm.title) {
                toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
                return;
            }

            await taskService.createTask({
                ...taskForm,
                projectId: projectId
            });

            toast({ title: "Success", description: "Task created successfully" });
            setIsAddTaskOpen(false);
            loadProjectData();

            // Reset form
            setTaskForm({
                title: "",
                description: "",
                priority: "medium",
                dueDate: "",
                estimatedHours: 0,
                assignedToId: undefined,
                projectId: projectId,
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
        }
    };

    const handleUpdateTask = async () => {
        if (!selectedTask) return;
        try {
            await taskService.updateTask(selectedTask.id, {
                title: selectedTask.title,
                description: selectedTask.description,
                priority: selectedTask.priority,
                dueDate: selectedTask.dueDate,
                estimatedHours: selectedTask.estimatedHours,
                assignedToId: selectedTask.assignedToId,
                status: selectedTask.status
            });

            toast({ title: "Success", description: "Task updated successfully" });
            setIsEditTaskOpen(false);
            loadProjectData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await taskService.deleteTask(taskId);
            toast({ title: "Success", description: "Task deleted successfully" });
            setIsTaskDetailOpen(false); // Close detail view if open
            loadProjectData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
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
            // Update comment count locally
            setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, commentCount: t.commentCount + 1 } : t));
        } catch (error) {
            toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await taskService.deleteComment(commentId);
            if (selectedTask) loadComments(selectedTask.id);
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "urgent": return "bg-red-500 hover:bg-red-600";
            case "high": return "bg-orange-500 hover:bg-orange-600";
            case "medium": return "bg-blue-500 hover:bg-blue-600";
            case "low": return "bg-green-500 hover:bg-green-600";
            default: return "bg-gray-500";
        }
    };

    // Permission helpers for team members
    const isTeamMember = user?.roles?.includes('TEAM_MEMBER');
    const isClient = user?.roles?.includes('CLIENT');
    const canManageTasks = !isTeamMember && !isClient;
    const canDragTask = (task: Task) => {
        if (!project?.isActive) return false;
        if (canManageTasks) return true;
        // Team members can only drag their own assigned tasks
        return task.assignedToId === user?.id;
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        );
    }

    if (!project) {
        return (
            <MainLayout>
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold">Project not found</h2>
                    <Button onClick={() => navigate("/projects")} className="mt-4">
                        Back to Projects
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const columns = [
        { id: "todo", title: "To Do" },
        { id: "in_progress", title: "In Progress" },
        { id: "review", title: "Review" },
        { id: "completed", title: "Done" }
    ];

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <Badge variant="outline">{project.isActive ? "Active" : "Inactive"}</Badge>
                                    <span>•</span>
                                    <span className="text-sm">
                                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-[200px]"
                                />
                            </div>
                            <div className="flex -space-x-2 mr-4">
                                {members.slice(0, 5).map((member) => (
                                    <Avatar key={member.id} className="border-2 border-background w-8 h-8">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {members.length > 5 && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-xs font-medium">
                                        +{members.length - 5}
                                    </div>
                                )}
                            </div>
                            {user?.roles && !user.roles.includes('TEAM_MEMBER') && !user.roles.includes('CLIENT') && project.isActive && (
                                <Button onClick={() => setIsAddTaskOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-3xl">{project.description}</p>

                    {!project.isActive && (
                        <Alert variant="destructive" className="bg-amber-50 text-amber-900 border-amber-200">
                            <Lock className="h-4 w-4 text-amber-900" />
                            <AlertTitle>Project is Inactive</AlertTitle>
                            <AlertDescription>
                                This project is currently inactive. You cannot add, edit, or move tasks until it is reactivated by an administrator.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto">
                    <div className="flex h-full gap-6 min-w-[1000px] pb-4">
                        {columns.map((column) => (
                            <div
                                key={column.id}
                                className="flex-1 bg-muted/30 rounded-lg p-4 flex flex-col gap-4 min-w-[280px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
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
                                                draggable={canDragTask(task)}
                                                onDragStart={(e) => canDragTask(task) && handleDragStart(e, task.id)}
                                                className={`${canDragTask(task) ? 'cursor-move hover:shadow-md active:cursor-grabbing' : 'cursor-default'} transition-all group`}
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
                                                        <div className="flex items-center gap-2">
                                                            {task.assignedToName ? (
                                                                <Avatar className="w-5 h-5">
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {task.assignedToName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            {task.dueDate && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
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
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                                        <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg text-sm text-muted-foreground/50">
                                            Drop items here
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Task Dialog */}
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                placeholder="Task title"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                placeholder="Task description"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Select
                                    value={taskForm.priority}
                                    onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
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
                                    value={taskForm.dueDate ? new Date(taskForm.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assign To</label>
                            <Select
                                value={taskForm.assignedToId?.toString()}
                                onValueChange={(v) => setTaskForm({ ...taskForm, assignedToId: Number(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.firstName} {member.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddTask}>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Detail View */}
            <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedTask && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>

                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</Badge>
                                    <Badge variant="outline">{selectedTask.status.replace("_", " ")}</Badge>
                                </div>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Assignee</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedTask.assignedToName ? (
                                                <>
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback>{selectedTask.assignedToName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{selectedTask.assignedToName}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Unassigned</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Due Date</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No date'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Hours</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedTask.estimatedHours || 0} est.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold">Description</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {selectedTask.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" /> Comments
                                    </h3>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3 text-sm">
                                                <Avatar className="h-8 w-8 mt-1">
                                                    <AvatarFallback className="text-xs">{comment.userName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 bg-muted/40 p-3 rounded-lg">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold">{comment.userName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </span>
                                                            {canManageTasks && project.isActive && (
                                                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-red-500" onClick={() => handleDeleteComment(comment.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p>{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {comments.length === 0 && !loadingComments && (
                                            <div className="text-center text-muted-foreground py-4 text-sm">
                                                No comments yet. Start the conversation!
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={project.isActive ? "Write a comment..." : "Comments are disabled for inactive projects"}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            disabled={!project.isActive}
                                        />
                                        <Button size="icon" onClick={handleAddComment} disabled={!project.isActive}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {canManageTasks && project.isActive && (
                                    <div className="flex justify-between border-t pt-4">
                                        <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={() => handleDeleteTask(selectedTask.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Task
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => {
                                                setIsEditTaskOpen(true);
                                                setIsTaskDetailOpen(false);
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Edit Task
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    {selectedTask && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={selectedTask.title}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={selectedTask.description}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={selectedTask.status}
                                        onValueChange={(v: any) => setSelectedTask({ ...selectedTask, status: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="review">Review</SelectItem>
                                            <SelectItem value="completed">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={selectedTask.priority}
                                        onValueChange={(v: any) => setSelectedTask({ ...selectedTask, priority: v })}
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assign To</label>
                                    <Select
                                        value={selectedTask.assignedToId?.toString() || "unassigned"}
                                        onValueChange={(v) => setSelectedTask({ ...selectedTask, assignedToId: v === "unassigned" ? undefined : Number(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {members.map(member => (
                                                <SelectItem key={member.id} value={member.id.toString()}>
                                                    {member.firstName} {member.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Due Date</label>
                                    <Input
                                        type="date"
                                        value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateTask}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
};

export default ProjectDetail;
