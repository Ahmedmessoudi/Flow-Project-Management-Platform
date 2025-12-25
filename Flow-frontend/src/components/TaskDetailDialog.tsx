import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MessageSquare, User, Clock, Tag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  assignee: {
    name: string;
    avatar?: string;
  };
  dueDate: string;
  comments: number;
  status: "todo" | "in-progress" | "review" | "done";
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{task.title}</DialogTitle>
              <DialogDescription className="mt-2">
                Task #{task.id}
              </DialogDescription>
            </div>
            <Badge
              variant={
                task.priority === "High"
                  ? "destructive"
                  : task.priority === "Medium"
                  ? "default"
                  : "secondary"
              }
            >
              {task.priority}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Task Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>

              <Separator />

              {/* Meta Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Assignee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Due Date</span>
                  </div>
                  <p className="text-sm">{task.dueDate}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Comments</span>
                  </div>
                  <p className="text-sm">{task.comments} comments</p>
                </div>
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Activity & Comments
                </h4>
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">JD</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">John Doe</span>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      Great progress on this task! Looking forward to the final result.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea placeholder="Add a comment..." rows={3} />
                <div className="flex justify-end">
                  <Button size="sm">Post Comment</Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
