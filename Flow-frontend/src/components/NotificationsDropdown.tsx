import { useState, useEffect } from "react";
import { Bell, Check, X, Info, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { notificationService, NotificationEvent } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + continuous polling so unread badge is up to date even when closed
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Extra refresh when dropdown is opened to ensure freshest view
  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Refresh from server in case new notifications arrived during the call
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationEvent) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);

    // Mark as read when opened
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'task':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'task':
        return <Badge variant="default">Task</Badge>;
      case 'meeting':
        return <Badge variant="secondary">Meeting</Badge>;
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>;
      case 'project':
        return <Badge variant="outline">Project</Badge>;
      default:
        return <Badge variant="outline">Notification</Badge>;
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0" align="end">
          <div className="flex items-center justify-between p-4">
            <h4 className="font-semibold text-lg">Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all
                  </Button>
                </>
              )}
            </div>
          </div>
          <Separator />
          <ScrollArea className="h-[400px]">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-accent cursor-pointer transition-colors ${!notification.isRead ? "bg-accent/50" : ""
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))
            )}
          </ScrollArea>
          <Separator />
          <div className="p-2">
            <Button variant="ghost" className="w-full text-sm" onClick={loadNotifications}>
              Refresh
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Notification Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {getNotificationIcon(selectedNotification?.type)}
              <div className="flex-1">
                <DialogTitle className="text-lg">{selectedNotification?.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getNotificationBadge(selectedNotification?.type)}
                  <span className="text-xs text-muted-foreground">
                    {selectedNotification?.createdAt && formatFullDate(selectedNotification.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{selectedNotification?.message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
