import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Bug, Calendar, FileText, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { taskService, Task, TaskComment } from "@/services/taskService";
import { format } from "date-fns";

const TeamMemberTasks = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Action states
  const [comment, setComment] = useState("");
  const [report, setReport] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugPriority, setBugPriority] = useState("medium");
  const [meetingReason, setMeetingReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments expansion state
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [taskComments, setTaskComments] = useState<Record<number, TaskComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasksByUser();
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = async (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }

    setExpandedTaskId(taskId);

    // Load comments if not already loaded or strict refresh needed
    // For now, let's always refresh to be safe
    try {
      setLoadingComments(prev => ({ ...prev, [taskId]: true }));
      const comments = await taskService.getTaskComments(taskId);
      setTaskComments(prev => ({ ...prev, [taskId]: comments }));
    } catch (error) {
      console.error("Error loading comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoadingComments(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleAddComment = async (taskId: number) => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await taskService.addTaskComment(taskId, comment);
      toast({
        title: "Success",
        description: "Comment added successfully"
      });
      setComment("");
      setDialogOpen({ ...dialogOpen, [`comment_${taskId}`]: false });

      // Refresh comments if this task is expanded
      if (expandedTaskId === taskId) {
        const comments = await taskService.getTaskComments(taskId);
        setTaskComments(prev => ({ ...prev, [taskId]: comments }));
      } else {
        // If not expanded, maybe expand it? 
        toggleComments(taskId);
      }

      // Update task comment count locally?
      // Easier to just reload tasks to update count if critical, but for now skip
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReport = async (taskId: number) => {
    if (!report.trim()) return;

    try {
      setIsSubmitting(true);
      const content = `[PROGRESS REPORT]\n${report}`;
      await taskService.addTaskComment(taskId, content);

      toast({
        title: "Success",
        description: "Progress report submitted"
      });
      setReport("");
      setDialogOpen({ ...dialogOpen, [`report_${taskId}`]: false });

      // Refresh comments
      if (expandedTaskId === taskId) {
        const comments = await taskService.getTaskComments(taskId);
        setTaskComments(prev => ({ ...prev, [taskId]: comments }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclareBug = async (taskId: number) => {
    if (!bugDescription.trim()) return;

    try {
      setIsSubmitting(true);
      const content = `[BUG REPORT] Priority: ${bugPriority.toUpperCase()}\n${bugDescription}`;
      await taskService.addTaskComment(taskId, content);

      toast({
        title: "Success",
        description: "Bug report submitted"
      });
      setBugDescription("");
      setDialogOpen({ ...dialogOpen, [`bug_${taskId}`]: false });

      // Refresh comments
      if (expandedTaskId === taskId) {
        const comments = await taskService.getTaskComments(taskId);
        setTaskComments(prev => ({ ...prev, [taskId]: comments }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bug report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestMeeting = () => {
    // Mock for now as no endpoint specified
    toast({
      title: "Meeting Request Sent",
      description: "Your meeting request has been sent to the project manager."
    });
    setMeetingReason("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      todo: { label: "To Do", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      review: { label: "In Review", variant: "outline" },
      completed: { label: "Completed", variant: "outline" },
      blocked: { label: "Blocked", variant: "destructive" }
    };
    return variants[status] || { label: status, variant: "secondary" };
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      urgent: { label: "Urgent", variant: "destructive" },
      high: { label: "High", variant: "destructive" },
      medium: { label: "Medium", variant: "default" },
      low: { label: "Low", variant: "secondary" }
    };
    return variants[priority] || { label: priority, variant: "secondary" };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading your tasks...</span>
        </div>
      </MainLayout>
    );
  }

  const stats = [
    {
      title: "My Tasks",
      value: tasks.length.toString(),
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "In Progress",
      value: tasks.filter(t => t.status === "in_progress").length.toString(),
      icon: AlertCircle,
      color: "text-orange-600"
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-2">
              View your assigned tasks and collaborate with your team
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Request Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Meeting</DialogTitle>
                <DialogDescription>
                  Request a meeting with your project manager
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Please describe the reason for the meeting..."
                value={meetingReason}
                onChange={(e) => setMeetingReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button onClick={handleRequestMeeting}>
                  Send Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p>No tasks assigned to you yet.</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{task.title}</CardTitle>
                        <Badge variant={getPriorityBadge(task.priority).variant}>
                          {getPriorityBadge(task.priority).label}
                        </Badge>
                        <Badge variant={getStatusBadge(task.status).variant}>
                          {getStatusBadge(task.status).label}
                        </Badge>
                      </div>
                      <CardDescription>{task.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 flex-wrap">
                        <span>Project: {task.projectName || "Unknown"}</span>
                        {task.dueDate && <><span>•</span><span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span></>}
                        {task.createdByName && <><span>•</span><span>Assigned by: {task.createdByName}</span></>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Dialog open={dialogOpen[`comment_${task.id}`]} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, [`comment_${task.id}`]: open })}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Comment</DialogTitle>
                          <DialogDescription>
                            Add a comment to "{task.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Write your comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                        />
                        <DialogFooter>
                          <Button onClick={() => handleAddComment(task.id)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Comment"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={dialogOpen[`report_${task.id}`]} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, [`report_${task.id}`]: open })}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit Progress Report</DialogTitle>
                          <DialogDescription>
                            Report your progress on "{task.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Describe your progress and any blockers..."
                          value={report}
                          onChange={(e) => setReport(e.target.value)}
                          rows={6}
                        />
                        <DialogFooter>
                          <Button onClick={() => handleSubmitReport(task.id)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={dialogOpen[`bug_${task.id}`]} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, [`bug_${task.id}`]: open })}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Bug className="w-4 h-4 mr-2" />
                          Report Bug
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report Bug</DialogTitle>
                          <DialogDescription>
                            Report a bug related to "{task.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={bugPriority} onValueChange={setBugPriority}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            placeholder="Describe the bug in detail..."
                            value={bugDescription}
                            onChange={(e) => setBugDescription(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleDeclareBug(task.id)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Bug Report"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="sm" onClick={() => toggleComments(task.id)}>
                      {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                      {expandedTaskId === task.id ? "Hide Comments" : `View Comments`}
                    </Button>
                  </div>

                  {/* Expanded Comments Section */}
                  {expandedTaskId === task.id && (
                    <div className="pt-4 border-t mt-4 space-y-4 bg-muted p-4 rounded-md">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        Comments
                        {loadingComments[task.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                      </h4>

                      {taskComments[task.id]?.length === 0 && !loadingComments[task.id] && (
                        <p className="text-sm text-muted-foreground italic">No comments yet.</p>
                      )}

                      {taskComments[task.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-card rounded-lg border shadow-sm">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{comment.userName?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-sm font-medium">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )))}
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamMemberTasks;
