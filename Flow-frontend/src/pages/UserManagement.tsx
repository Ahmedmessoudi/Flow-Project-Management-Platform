import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Building2, Power } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectService } from "@/services/projectService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { userService, User, Role, CreateUserData, UpdateUserData } from "@/services/userService";

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Form state for add user
  const [newUser, setNewUser] = useState<CreateUserData>({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    roles: [],
    projectId: undefined,
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // Form state for edit user
  const [editUser, setEditUser] = useState<UpdateUserData>({});

  useEffect(() => {
    loadUsers();
    loadRoles();
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

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await userService.getAllRoles();
      setRoles(data);
    } catch (error: any) {
      console.error("Error loading roles:", error);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (newUser.password !== confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      // send roles as list of strings
      const payload: CreateUserData = { ...newUser, roles: newUser.roles };
      const createdUser = await userService.createUser(payload);

      // If client and project selected, assign to project
      if (newUser.roles.includes("CLIENT") && newUser.projectId) {
        await projectService.addMember(newUser.projectId, createdUser.id, "CLIENT");
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsAddDialogOpen(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        roles: [],
        projectId: undefined,
      });
      setConfirmPassword("");
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Prevent editing protected accounts' critical fields
      const protectedRoles = ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"];
      const isProtected = selectedUser.roles?.some((r) => protectedRoles.includes(r));
      if (isProtected) {
        // If trying to deactivate or change roles of a protected account, block
        if (editUser.isActive === false || (editUser.roles && editUser.roles.length > 0 && !editUser.roles.some(r => selectedUser.roles?.includes(r)))) {
          toast({
            title: "Action not allowed",
            description: "Cannot change roles or deactivate a protected account",
            variant: "destructive",
          });
          return;
        }
      }

      await userService.updateUser(selectedUser.id, editUser);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditUser({});
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    try {
      // Prevent toggling protected accounts client-side as a UX guard
      const protectedRoles = ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"];
      if (selectedUser.roles?.some((r) => protectedRoles.includes(r))) {
        toast({
          title: "Action not allowed",
          description: "Cannot change status of a protected account",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      const newStatus = !selectedUser.isActive;
      await userService.updateUser(selectedUser.id, { isActive: newStatus });
      toast({
        title: "Success",
        description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: `Error ${selectedUser.isActive ? 'deactivating' : 'activating'} user`,
        description: error.message || `Failed to ${selectedUser.isActive ? 'deactivate' : 'activate'} user`,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      isActive: user.isActive,
      roles: user.roles || [],
    });
    setIsEditDialogOpen(true);
  };

  const isProtectedUser = (user: User | null) => {
    if (!user) return false;
    const protectedRoles = ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"];
    return user.roles?.some((r) => protectedRoles.includes(r));
  };

  const openToggleStatusDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive";
      case "ORG_ADMIN":
        return "default";
      case "PROJECT_MANAGER":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, roles, and permissions across the application
            </p>
          </div>

          {/* Add User Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with role assignment
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="johndoe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 6 characters"
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
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newUser.roles?.[0] || ""}
                    onValueChange={(value) => setNewUser({ ...newUser, roles: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newUser.roles?.includes("CLIENT") && (
                  <div className="grid gap-2">
                    <Label htmlFor="project">Assign Project *</Label>
                    <Select
                      value={newUser.projectId?.toString()}
                      onValueChange={(value) => setNewUser({ ...newUser, projectId: parseInt(value) })}
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
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddUser}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.id}</TableCell>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)}>
                              {role.replace(/_/g, " ")}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.organizations && user.organizations.length > 0 ? (
                          user.organizations.map((org) => (
                            <Badge key={org.id} variant="outline" className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {org.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={!user.isActive}
                          title={!user.isActive ? "Reactivate user to edit" : "Edit user"}
                        >
                          <Pencil className={`h-4 w-4 ${!user.isActive ? 'opacity-50' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openToggleStatusDialog(user)}
                          disabled={!!user.roles?.some(r => ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"].includes(r))}
                          title={user.roles?.some(r => ["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"].includes(r)) ? "Protected account" : (user.isActive ? "Deactivate user" : "Activate user")}
                        >
                          <Power className={`h-4 w-4 ${user.isActive ? 'text-orange-500' : 'text-green-500'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editUser.firstName || ""}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editUser.lastName || ""}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editUsername">Username</Label>
                <Input
                  id="editUsername"
                  value={editUser.username || ""}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email || ""}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPassword">Password (leave empty to keep current)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editUser.password || ""}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="New password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editUser.phone || ""}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editUser.roles?.[0] || ""}
                  onValueChange={(value) => setEditUser({ ...editUser, roles: [value] })}
                  disabled={isProtectedUser(selectedUser)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editUser.isActive !== false}
                  onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                  disabled={isProtectedUser(selectedUser)}
                  className="h-4 w-4"
                />
                <Label htmlFor="editIsActive">Account Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Update User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser?.isActive ? (
                  <>This will deactivate the user account for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>. The user will no longer be able to access the application.</>
                ) : (
                  <>This will activate the user account for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>. The user will regain access to the application.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleUserStatus}
                className={selectedUser?.isActive ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
              >
                {selectedUser?.isActive ? 'Deactivate' : 'Activate'} User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
