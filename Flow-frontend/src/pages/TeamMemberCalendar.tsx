import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { taskService, Task } from "@/services/taskService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectService } from "@/services/projectService";
import { meetingService } from "@/services/meetingService";

const TeamMemberCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Meeting State
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    projectId: "",
    scheduledAt: ""
  });

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

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

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.projectId) {
      toast({ title: "Error", description: "Please select a project", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await meetingService.requestMeeting({
        title: meetingForm.title,
        description: meetingForm.description,
        projectId: parseInt(meetingForm.projectId),
        scheduledAt: new Date(meetingForm.scheduledAt).toISOString()
      });

      toast({ title: "Success", description: "Meeting request sent to Project Manager" });
      setIsMeetingDialogOpen(false);
      setMeetingForm({ title: "", description: "", projectId: "", scheduledAt: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to request meeting", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), selectedDate);
    });
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

  const tasksForSelectedDate = getTasksForSelectedDate();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading calendar...</span>
        </div>
      </MainLayout>
    );
  }

  // Function to add indicators to calendar days
  const modifiers = {
    hasTask: (date: Date) => {
      return tasks.some(task => task.dueDate && isSameDay(new Date(task.dueDate), date));
    }
  };

  const modifiersStyles = {
    hasTask: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      color: 'var(--primary)'
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Calendar</h1>
            <p className="text-muted-foreground mt-2">
              View your assigned tasks timeline and deadlines
            </p>
          </div>
          <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Meeting</DialogTitle>
                <DialogDescription>
                  Schedule a meeting with your project manager.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequestMeeting} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    required
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    placeholder="Meeting topic"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, projectId: value })}
                    defaultValue={meetingForm.projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={meetingForm.description}
                    onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                    placeholder="Agenda or details..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time</label>
                  <Input
                    type="datetime-local"
                    required
                    value={meetingForm.scheduledAt}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Requesting..." : "Send Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Task Calendar</CardTitle>
              <CardDescription>
                Select a date to view tasks due on that day
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
            </CardContent>
          </Card>

          {/* Tasks for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle>
                Tasks for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
              </CardTitle>
              <CardDescription>
                {tasksForSelectedDate.length === 0
                  ? "No tasks scheduled for this date"
                  : `${tasksForSelectedDate.length} task(s) due`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasksForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks found for this day.
                  </div>
                ) : (
                  tasksForSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors ${selectedTaskId === task.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge variant={getPriorityBadge(task.priority).variant} className="ml-2">
                          {getPriorityBadge(task.priority).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Project: {task.projectName || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(task.status).variant}>
                          {getStatusBadge(task.status).label}
                        </Badge>
                        {task.assignedToName && (
                          <span className="text-xs text-muted-foreground">
                            Assigned to: {task.assignedToName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Project Tasks Timeline - List upcoming tasks */}
        <Card>
          <CardHeader>
            <CardTitle>All Upcoming Tasks</CardTitle>
            <CardDescription>
              Timeline of your future tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks
                .filter(t => t.dueDate && new Date(t.dueDate) >= new Date()) // Only future tasks
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()) // Sort by date
                .slice(0, 5) // Limit to 5
                .map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.dueDate) {
                        setSelectedDate(new Date(task.dueDate));
                        setSelectedTaskId(task.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge variant={getPriorityBadge(task.priority).variant}>
                          {getPriorityBadge(task.priority).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Project: {task.projectName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Due: {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "N/A"}
                      </div>
                      <Badge variant={getStatusBadge(task.status).variant}>
                        {getStatusBadge(task.status).label}
                      </Badge>
                    </div>
                  </div>
                ))}
              {tasks.filter(t => t.dueDate && new Date(t.dueDate) >= new Date()).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No upcoming tasks.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TeamMemberCalendar;
