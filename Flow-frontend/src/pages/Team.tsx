import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus,
  MoreVertical,
  Loader2,
  Users,
  Crown,
  Briefcase,
  UserCheck,
  Trash2,
  Building2
} from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { User, userService } from "@/services/userService";
import { projectService, Project } from "@/services/projectService";
import { Organization, organizationService } from "@/services/organizationService";
import ProjectTeam from "./ProjectTeam";
import { UserX, UserCheck2 } from "lucide-react";

interface TeamStats {
  totalMembers: number;
  projectManagers: number;
  teamMembers: number;
  clients: number;
  organizationId: number | null;
  organizationName: string | null;
}

interface CreateMemberData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
  projectId?: number;
}

const Team = () => {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();

  // Conditionally render ProjectTeam view for Project Managers
  if (user?.role === 'PROJECT_MANAGER' || (user?.roles?.includes('PROJECT_MANAGER') && !user?.roles?.includes('ORG_ADMIN'))) {
    return <ProjectTeam />;
  }

  // Always show button for ORG_ADMIN or SUPER_ADMIN
  const canInvite = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN' ||
    hasAccess(['ORG_ADMIN', 'SUPER_ADMIN']);

  const [members, setMembers] = useState<User[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    projectManagers: 0,
    teamMembers: 0,
    clients: 0,
    organizationId: null,
    organizationName: null
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for adding member
  const [newMember, setNewMember] = useState<CreateMemberData>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "TEAM_MEMBER",
    phone: "",
    projectId: undefined,
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganizationId) {
      loadTeamData();
      loadProjects(selectedOrganizationId);
      setNewMember((prev) => ({ ...prev, projectId: undefined }));
    } else {
      setMembers([]);
      setProjects([]);
    }
  }, [selectedOrganizationId]);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationService.getAllOrganizations();
      setOrganizations(orgs);

      // Default to first organization if available and none selected
      if (orgs.length > 0 && !selectedOrganizationId) {
        setSelectedOrganizationId(orgs[0].id);
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
    }
  };

  const loadTeamData = async () => {
    if (!selectedOrganizationId) return;

    try {
      setLoading(true);
      // Load stats and members specific to the selected organization
      const [statsData, membersData] = await Promise.all([
        api.get(`/api/team/organizations/${selectedOrganizationId}/stats`).catch(() => ({
          totalMembers: 0,
          projectManagers: 0,
          teamMembers: 0,
          clients: 0,
          organizationId: selectedOrganizationId,
          organizationName: null
        })),
        api.get(`/api/organizations/${selectedOrganizationId}/members`).catch(() => [])
      ]);
      setStats(statsData);
      setMembers(membersData);
    } catch (error: any) {
      console.error("Error loading team data:", error);
      // Set default values on error
      setStats({
        totalMembers: 0,
        projectManagers: 0,
        teamMembers: 0,
        clients: 0,
        organizationId: selectedOrganizationId,
        organizationName: null
      });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (organizationId: number) => {
    try {
      const data = await projectService.getProjectsByOrganization(organizationId);
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects for organization:", error);
      setProjects([]);
    }
  };

  const handleAddMember = async () => {
    try {
      if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.username || !newMember.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (newMember.password !== confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (!selectedOrganizationId) {
        toast({
          title: "Error",
          description: "No organization selected",
          variant: "destructive",
        });
        return;
      }

      if (newMember.role === "CLIENT" && !newMember.projectId) {
        toast({
          title: "Validation Error",
          description: "Please select a project for the client",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      const createdUser = await api.post(`/api/team/organizations/${selectedOrganizationId}/members`, newMember);

      // Ensure client is linked to the selected project (mirror UserManagement behavior)
      if (newMember.role === "CLIENT" && newMember.projectId) {
        await projectService.addMember(newMember.projectId, createdUser.id, "CLIENT");
      }

      toast({
        title: "Success",
        description: `${newMember.firstName} ${newMember.lastName} has been added to the team`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      loadTeamData();
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !selectedOrganizationId) return;

    try {
      setSubmitting(true);
      await api.del(`/api/organizations/${selectedOrganizationId}/members/${selectedMember.id}`);

      toast({
        title: "Success",
        description: `${selectedMember.firstName} ${selectedMember.lastName} has been removed from the team`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewMember({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "TEAM_MEMBER",
      phone: "",
      projectId: undefined,
    });
    setConfirmPassword("");
  };

  const handleToggleStatus = async (member: User) => {
    try {
      setSubmitting(true);
      const newStatus = !member.isActive;
      await userService.updateUserStatus(member.id, newStatus);

      toast({
        title: "Success",
        description: `${member.firstName} ${member.lastName} is now ${newStatus ? 'active' : 'inactive'}`,
      });

      loadTeamData();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return "secondary";
    if (roles.includes("PROJECT_MANAGER")) return "default";
    if (roles.includes("CLIENT")) return "outline";
    return "secondary";
  };

  const getRoleLabel = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return "Team Member";
    if (roles.includes("PROJECT_MANAGER")) return "Project Manager";
    if (roles.includes("CLIENT")) return "Client";
    if (roles.includes("TEAM_MEMBER")) return "Team Member";
    return roles[0];
  };

  const getRoleIcon = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return <Users className="h-4 w-4" />;
    if (roles.includes("PROJECT_MANAGER")) return <Crown className="h-4 w-4" />;
    if (roles.includes("CLIENT")) return <Briefcase className="h-4 w-4" />;
    return <UserCheck className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading team...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground mt-2">
              Manage your team members and their roles
              {organizations.length > 1 ? (
                <div className="mt-4 max-w-xs">
                  <Select
                    value={selectedOrganizationId?.toString()}
                    onValueChange={(value) => setSelectedOrganizationId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {org.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                stats?.organizationName && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {stats.organizationName}
                  </span>
                )
              )}
            </p>
          </div>

          {canInvite && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Create a new team member. They will be automatically added to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={newMember.username}
                      onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                      placeholder="johndoe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) =>
                        setNewMember({
                          ...newMember,
                          role: value,
                          projectId: value === "CLIENT" ? newMember.projectId : undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEAM_MEMBER">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Team Member
                          </div>
                        </SelectItem>
                        <SelectItem value="PROJECT_MANAGER">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Project Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="CLIENT">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Client
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newMember.role === "CLIENT" && (
                    <div className="grid gap-2">
                      <Label htmlFor="project">Assign Project *</Label>
                      <Select
                        value={newMember.projectId?.toString()}
                        onValueChange={(value) =>
                          setNewMember({ ...newMember, projectId: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={projects.length ? "Select project" : "No projects available"} />
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
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAddMember}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Member"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Team Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalMembers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Project Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.projectManagers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-500" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.teamMembers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-500" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.clients || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {stats?.organizationName
                ? `All members of ${stats.organizationName}`
                : "All members across your organization"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No team members yet</h3>
                <p className="text-muted-foreground mt-1">
                  {canInvite
                    ? "Click 'Add Member' to add your first team member"
                    : "No members have been added to this organization"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className={`font-medium ${member.firstName === 'Deleted' && member.lastName === 'User' ? 'text-muted-foreground italic' : ''}`}>
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={getRoleBadgeVariant(member.roles)} className="flex items-center gap-1">
                        {getRoleIcon(member.roles)}
                        {getRoleLabel(member.roles)}
                      </Badge>
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {canInvite && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={member.firstName === 'Deleted' && member.lastName === 'User'}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(member)}
                              disabled={submitting || (member.firstName === 'Deleted' && member.lastName === 'User')}
                            >
                              {member.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck2 className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={member.firstName === 'Deleted' && member.lastName === 'User'}
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove team member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedMember?.firstName} {selectedMember?.lastName} from the team?
                This will revoke their access to the organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedMember(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-destructive hover:bg-destructive/90"
                disabled={submitting}
              >
                {submitting ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Team;
