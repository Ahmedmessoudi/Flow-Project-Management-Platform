import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Building2, Power } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { organizationService, Organization, CreateOrganizationData, UpdateOrganizationData } from "@/services/organizationService";
import { userService, User } from "@/services/userService";

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgAdmins, setOrgAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { toast } = useToast();

  // Form state for add organization
  const [newOrg, setNewOrg] = useState<CreateOrganizationData>({
    name: "",
    description: "",
    orgAdminId: 0,
  });

  // Form state for edit organization
  const [editOrg, setEditOrg] = useState<UpdateOrganizationData>({});

  useEffect(() => {
    loadOrganizations();
    loadOrgAdmins();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getAllOrganizationsForManagement();
      setOrganizations(data);
    } catch (error: any) {
      toast({
        title: "Error loading organizations",
        description: error.message || "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrgAdmins = async () => {
    try {
      // Get all users with ORG_ADMIN role
      const data = await userService.getUsersByRole?.("ORG_ADMIN") || [];
      setOrgAdmins(data);
    } catch (error: any) {
      console.error("Error loading org admins:", error);
    }
  };

  const handleAddOrganization = async () => {
    try {
      if (!newOrg.name || !newOrg.orgAdminId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      await organizationService.createOrganization(newOrg);
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      setIsAddDialogOpen(false);
      setNewOrg({ name: "", description: "", orgAdminId: 0 });
      loadOrganizations();
    } catch (error: any) {
      toast({
        title: "Error creating organization",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  const handleEditOrganization = async () => {
    if (!selectedOrg) return;

    try {
      await organizationService.updateOrganization(selectedOrg.id, editOrg);
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedOrg(null);
      setEditOrg({});
      loadOrganizations();
    } catch (error: any) {
      toast({
        title: "Error updating organization",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const handleToggleOrganizationStatus = async () => {
    if (!selectedOrg) return;

    const newStatus = !selectedOrg.isActive;
    try {
      await organizationService.updateOrganization(selectedOrg.id, { isActive: newStatus });
      toast({
        title: "Success",
        description: `Organization ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
      setIsDeactivateDialogOpen(false);
      setSelectedOrg(null);
      loadOrganizations();
    } catch (error: any) {
      toast({
        title: `Error ${newStatus ? 'activating' : 'deactivating'} organization`,
        description: error.message || `Failed to ${newStatus ? 'activate' : 'deactivate'} organization`,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setEditOrg({
      name: org.name,
      description: org.description,
      orgAdminId: org.orgAdminId,
      isActive: org.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openToggleStatusDialog = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeactivateDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organization Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage organizations, projects, and team structures
            </p>
          </div>

          {/* Add Organization Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to manage projects and teams
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="org-description">Description</Label>
                  <Textarea
                    id="org-description"
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    placeholder="Brief description of the organization"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="org-admin">Organization Admin *</Label>
                  <Select
                    value={newOrg.orgAdminId?.toString() || ""}
                    onValueChange={(value) => setNewOrg({ ...newOrg, orgAdminId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id.toString()}>
                          {admin.firstName} {admin.lastName} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddOrganization}>
                  Create Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Org Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="font-medium">{org.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {org.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{org.projectCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{org.memberCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {org.orgAdminName ? (
                        <div className="text-sm">
                          <div className="font-medium">{org.orgAdminName}</div>
                          <div className="text-muted-foreground text-xs">{org.orgAdminEmail}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{org.createdByName}</div>
                        <div className="text-muted-foreground text-xs">
                          {org.createdByRoles?.join(", ")} • {formatDate(org.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">{formatDate(org.updatedAt)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(org)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openToggleStatusDialog(org)}
                          title={org.isActive ? "Deactivate organization" : "Activate organization"}
                        >
                          <Power className={`h-4 w-4 ${org.isActive ? 'text-orange-500' : 'text-green-500'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Organization Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update organization information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  value={editOrg.name || ""}
                  onChange={(e) => setEditOrg({ ...editOrg, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editOrg.description || ""}
                  onChange={(e) => setEditOrg({ ...editOrg, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-admin">Organization Admin</Label>
                <Select
                  value={editOrg.orgAdminId?.toString() || ""}
                  onValueChange={(value) => setEditOrg({ ...editOrg, orgAdminId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.firstName} {admin.lastName} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editOrg.isActive !== false}
                  onChange={(e) => setEditOrg({ ...editOrg, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-active">Organization Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditOrganization}>Update Organization</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedOrg?.isActive ? (
                  <>This will deactivate the organization <strong>{selectedOrg?.name}</strong>. User access to projects within this organization will be suspended. You can reactivate it later.</>
                ) : (
                  <>This will activate the organization <strong>{selectedOrg?.name}</strong>. Users will regain access to projects within this organization.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleOrganizationStatus}
                className={selectedOrg?.isActive ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
              >
                {selectedOrg?.isActive ? 'Deactivate' : 'Activate'} Organization
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default OrganizationManagement;
