import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Search,
  LogOut,
  Building2,
  Calendar as CalendarIcon,
  Lock,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // For clients, default home should be their overview; others keep dashboard
  const homePath = user?.role === "CLIENT" ? "/client/overview" : "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to={homePath} className="flex items-center gap-2">
              <img
                src="/favicon.ico"
                alt="Flow Logo"
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-bold text-lg">Flow</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {getNavigationForRole(user?.role).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2",
                      isActive(item.path) && "bg-secondary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
            <NotificationsDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/reset-password')}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                {user?.role === 'SUPER_ADMIN' && (
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>System Settings</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Team",
    path: "/team",
    icon: Users,
  },
];

const clientNavigation = [
  {
    name: "Overview",
    path: "/client/overview",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/client/projects",
    icon: FolderKanban,
  },
];

const teamMemberNavigation = [
  {
    name: "My Tasks",
    path: "/team-member/tasks",
    icon: CheckSquare,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Calendar",
    path: "/team-member/calendar",
    icon: CalendarIcon,
  },
];

const superAdminNavigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
  },
  {
    name: "Organizations",
    path: "/organizations",
    icon: Building2,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const getNavigationForRole = (role?: string) => {
  if (role === 'SUPER_ADMIN') {
    return superAdminNavigation;
  }
  if (role === 'CLIENT') {
    return clientNavigation;
  }
  if (role === 'TEAM_MEMBER') {
    return teamMemberNavigation;
  }
  return navigation;
};

export default MainLayout;
