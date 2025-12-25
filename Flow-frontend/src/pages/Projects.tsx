import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterPopover } from "@/components/FilterPopover";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FolderKanban,
  Users,
  Calendar,
  MoreVertical,
  X,
  UserPlus,
  Crown,
  Loader2,
  Trash2,
  Power,
  FileText,
  ExternalLink,
  Search
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MainLayout from "@/components/layouts/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { projectService, Project, CreateProjectData, ProjectDocument } from "@/services/projectService";
import { organizationService, Organization } from "@/services/organizationService";
import { userService, User } from "@/services/userService";
import { api } from "@/lib/api";
import { OrganizationMember } from "@/types/organizationMember";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [projectManagers, setProjectManagers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { toast } = useToast();

  // Form state for add project
  const [newProject, setNewProject] = useState<CreateProjectData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: undefined,
    currency: "USD",
    projectManagerId: undefined,
    memberIds: [],
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number>(0);
  const [selectedProjectManagers, setSelectedProjectManagers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<OrganizationMember[]>([]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // Docs management state
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false);
  const [selectedProjectForDocs, setSelectedProjectForDocs] = useState<Project | null>(null);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [newDoc, setNewDoc] = useState({ title: "", url: "", type: "PDF" });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedDocIds, setUploadedDocIds] = useState<number[]>([]);

  useEffect(() => {
    loadProjects();
    loadOrganizations();
  }, []);

  // Load organization members when organization is selected
  useEffect(() => {
    if (selectedOrganizationId > 0) {
      loadOrganizationMembers(selectedOrganizationId);
    } else {
      setOrganizationMembers([]);
      setProjectManagers([]);
      setSelectedProjectManagers([]);
      setSelectedMembers([]);
    }
  }, [selectedOrganizationId]);

  // Apply filters and search
  useEffect(() => {
    let result = projects;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Filters
    if (activeFilters["Status"] && activeFilters["Status"].length > 0) {
      const statusFilters = activeFilters["Status"];
      result = result.filter(p => {
        if (statusFilters.includes("active") && p.isActive) return true;
        if (statusFilters.includes("inactive") && !p.isActive) return true;
        return false;
      });
    }

    if (activeFilters["Organization"] && activeFilters["Organization"].length > 0) {
      const orgFilters = activeFilters["Organization"];
      result = result.filter(p => p.organizationId && orgFilters.includes(p.organizationId.toString()));
    }

    setFilteredProjects(result);
  }, [projects, searchQuery, activeFilters]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message || "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getAllOrganizations();
      setOrganizations(data);
    } catch (error: any) {
      console.error("Error loading organizations:", error);
    }
  };

  const loadOrganizationMembers = async (orgId: number) => {
    try {
      setLoadingMembers(true);
      // Get all members of this organization
      // The endpoint now returns OrganizationMemberDTO[] which matches OrganizationMember interface
      const members: OrganizationMember[] = await api.get(`/api/organizations/${orgId}/members`);
      setOrganizationMembers(members);

      // Filter project managers (users with PROJECT_MANAGER role in this organization)
      const pms = members.filter((m) => m.organizationRole === "PROJECT_MANAGER");
      setProjectManagers(pms);
    } catch (error: any) {
      console.error("Error loading organization members:", error);
      toast({
        title: "Error loading members",
        description: "Failed to load organization members",
        variant: "destructive"
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddProject = async () => {
    try {
      if (!newProject.name || !selectedOrganizationId) {
        toast({
          title: "Validation Error",
          description: "Please fill in project name and select an organization",
          variant: "destructive",
        });
        return;
      }

      const projectData = {
        ...newProject,
        projectManagerId: selectedProjectManagers.length > 0 ? selectedProjectManagers[0].id : undefined,
        memberIds: selectedMembers.map(m => m.id),
      };

      await projectService.createProject(projectData, selectedOrganizationId);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadProjects();
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewProject({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: undefined,
      currency: "USD",
      projectManagerId: undefined,
      memberIds: [],
    });
    setSelectedOrganizationId(0);
    setSelectedProjectManagers([]);
    setSelectedMembers([]);
    setOrganizationMembers([]);
    setProjectManagers([]);
  };

  // Add project manager
  const addProjectManager = (pmId: string) => {
    const pm = projectManagers.find(m => m.id === parseInt(pmId));
    if (pm && !selectedProjectManagers.find(m => m.id === pm.id)) {
      setSelectedProjectManagers([...selectedProjectManagers, pm]);
    }
  };

  const removeProjectManager = (pmId: number) => {
    setSelectedProjectManagers(selectedProjectManagers.filter(m => m.id !== pmId));
  };

  // Add team member
  const addMember = (memberId: string) => {
    const member = organizationMembers.find(m => m.id === parseInt(memberId));
    if (member && !selectedMembers.find(m => m.id === member.id)) {
      // Don't add if already a project manager
      if (!selectedProjectManagers.find(pm => pm.id === member.id)) {
        setSelectedMembers([...selectedMembers, member]);
      }
    }
  };

  const removeMember = (memberId: number) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
  };

  const filterSections = [
    {
      title: "Status",
      type: "checkbox" as const,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      title: "Organization",
      type: "checkbox" as const,
      options: organizations.map(org => ({
        label: org.name,
        value: org.id.toString(),
      })),
    },
  ];

  const handleStatusChange = async (project: Project) => {
    try {
      const newStatus = !project.isActive;
      await projectService.updateProjectStatus(project.id, newStatus);
      toast({
        title: "Status Updated",
        description: `Project ${project.name} is now ${newStatus ? 'active' : 'inactive'}. Email notifications sent.`,
      });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone and notifies all members.`)) {
      return;
    }
    try {
      await projectService.deleteProject(project.id);
      toast({
        title: "Project Deleted",
        description: `Project ${project.name} has been deleted. Email notifications sent.`,
      });
      loadProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const openDocsDialog = async (project: Project) => {
    setSelectedProjectForDocs(project);
    setIsDocsDialogOpen(true);
    loadProjectDocs(project.id);
  };

  const loadProjectDocs = async (projectId: number) => {
    try {
      setLoadingDocs(true);
      const docs = await projectService.getProjectDocuments(projectId);
      setProjectDocs(docs);
    } catch (error) {
      console.error("Error loading docs:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocsDialogChange = async (open: boolean) => {
    setIsDocsDialogOpen(open);
    if (!open) {
      // Dialog closing - trigger batch notification
      if (uploadedDocIds.length > 0 && selectedProjectForDocs) {
        try {
          await projectService.notifyDocuments(selectedProjectForDocs.id, uploadedDocIds);
          toast({ title: "Notifications Sent", description: "Team members notified of new documents." });
        } catch (error: any) {
          console.error("Batch notification failed:", error);
        }
        setUploadedDocIds([]);
      }
    } else {
      // Dialog opening - reset batch list
      setUploadedDocIds([]);
    }
  };

  const handleAddDoc = async () => {
    if (!selectedProjectForDocs || !newDoc.title) return;
    try {
      const isDataUrl = newDoc.url?.startsWith("data:");
      const doc = await projectService.addDocument(selectedProjectForDocs.id, {
        title: newDoc.title,
        type: newDoc.type,
        data: isDataUrl ? newDoc.url : undefined,
        fileName: isDataUrl ? newDoc.title : undefined,
        contentType: isDataUrl ? newDoc.url?.split(";")[0].replace("data:", "") : undefined,
        size: undefined, // size not available from data URL; backend will store byte length
      });

      // Track ID for batch notification
      setUploadedDocIds(prev => [...prev, doc.id]);

      toast({ title: "Success", description: "Document added" });
      setNewDoc({ title: "", url: "", type: "PDF" });
      loadProjectDocs(selectedProjectForDocs.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const acceptedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp"
  ];

  const deriveDocType = (file: File) => {
    if (file.type.includes("pdf")) return "PDF";
    if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) return "DOC";
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.includes("text")) return "TXT";
    return "FILE";
  };

  const handleFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const file = e.dataTransfer.files[0];
    if (!acceptedMimeTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Allowed: PDF, DOC/DOCX, TXT, images (png/jpg/gif/webp)",
        variant: "destructive",
      });
      return;
    }
    try {
      const dataUrl = await handleFileToBase64(file);
      setNewDoc({
        title: file.name,
        url: dataUrl,
        type: deriveDocType(file),
      });
      toast({
        title: "File ready",
        description: "Click Add Document to upload.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not read file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await projectService.deleteDocument(docId);
      toast({ title: "Success", description: "Document deleted" });
      if (selectedProjectForDocs) loadProjectDocs(selectedProjectForDocs.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getProjectColor = (index: number) => {
    const colors = [
      "bg-gradient-primary",
      "bg-purple-500",
      "bg-orange-500",
      "bg-green-500",
      "bg-blue-600",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading projects...</span>
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
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your projects in one place
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <FilterPopover sections={filterSections} onApply={setActiveFilters} />

            {/* Add Project Dialog - hidden for TEAM_MEMBER */}
            {user?.roles && !user.roles.includes('TEAM_MEMBER') && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5" />
                      Create New Project
                    </DialogTitle>
                    <DialogDescription>
                      Add a new project to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    {/* Project Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="project-name">Project Name *</Label>
                      <Input
                        id="project-name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="Enter project name"
                      />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Brief description of the project"
                        rows={3}
                      />
                    </div>

                    {/* Organization */}
                    <div className="grid gap-2">
                      <Label htmlFor="organization">Organization *</Label>
                      <Select
                        value={selectedOrganizationId?.toString() || ""}
                        onValueChange={(value) => setSelectedOrganizationId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={newProject.startDate}
                          onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={newProject.endDate}
                          onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="budget">Budget</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={newProject.budget || ""}
                          onChange={(e) => setNewProject({ ...newProject, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={newProject.currency || "USD"}
                          onValueChange={(value) => setNewProject({ ...newProject, currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="TND">TND (د.ت)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Project Manager Section */}
                    <div className="grid gap-2 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          Project Manager(s)
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {selectedProjectManagers.length} selected
                        </span>
                      </div>

                      {/* Add PM Dropdown */}
                      <div className="flex gap-2">
                        <Select
                          onValueChange={addProjectManager}
                          disabled={!selectedOrganizationId || loadingMembers}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={
                              !selectedOrganizationId
                                ? "Select organization first"
                                : loadingMembers
                                  ? "Loading..."
                                  : "Select project manager"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {projectManagers
                              .filter(pm => !selectedProjectManagers.find(spm => spm.id === pm.id))
                              .map((pm) => (
                                <SelectItem key={pm.id} value={pm.id.toString()}>
                                  {pm.firstName} {pm.lastName} ({pm.email})
                                </SelectItem>
                              ))}
                            {projectManagers.length === 0 && !loadingMembers && selectedOrganizationId > 0 && (
                              <SelectItem value="none" disabled>
                                No project managers in this organization
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!selectedOrganizationId}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Selected PMs List */}
                      {selectedProjectManagers.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {selectedProjectManagers.map((pm) => (
                            <div
                              key={pm.id}
                              className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                  <Crown className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {pm.firstName} {pm.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {pm.email}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProjectManager(pm.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedProjectManagers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No project managers assigned yet
                        </p>
                      )}
                    </div>

                    {/* Team Members Section */}
                    <div className="grid gap-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Team Members
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {selectedMembers.length} member(s) added
                        </span>
                      </div>

                      {/* Add Member Dropdown */}
                      <div className="flex gap-2">
                        <Select
                          onValueChange={addMember}
                          disabled={!selectedOrganizationId || loadingMembers}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={
                              !selectedOrganizationId
                                ? "Select organization first"
                                : loadingMembers
                                  ? "Loading members..."
                                  : "Select a member to add"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationMembers
                              .filter(m =>
                                !selectedMembers.find(sm => sm.id === m.id) &&
                                !selectedProjectManagers.find(pm => pm.id === m.id) &&
                                m.organizationRole === 'TEAM_MEMBER'
                              )
                              .map((member) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.firstName} {member.lastName} ({member.email})
                                </SelectItem>
                              ))}
                            {organizationMembers.length === 0 && !loadingMembers && selectedOrganizationId > 0 && (
                              <SelectItem value="none" disabled>
                                No members in this organization
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!selectedOrganizationId}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Selected Members List */}
                      {selectedMembers.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {selectedMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMember(member.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedMembers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                          No team members added yet. Select an organization first, then add members.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddProject}>
                      Create Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Manage Documents Dialog */}
        <Dialog open={isDocsDialogOpen} onOpenChange={handleDocsDialogChange}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Documents - {selectedProjectForDocs?.name}</DialogTitle>
              <DialogDescription>Add or remove project documentation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="grid gap-1">
                  <Label>Title</Label>
                  <Input
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="e.g. Requirements"
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Type</Label>
                  <Select
                    value={newDoc.type}
                    onValueChange={(val) => setNewDoc({ ...newDoc, type: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOC">Word</SelectItem>
                      <SelectItem value="TXT">Text</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div
                className={`border-2 border-dashed rounded-md p-4 text-center text-sm transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="font-medium">Drag & drop a file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Allowed: PDF, DOC/DOCX, TXT, images (png/jpg/gif/webp)
                </p>
                {newDoc.title && newDoc.url && (
                  <p className="text-xs mt-2 text-foreground">Ready: {newDoc.title}</p>
                )}
              </div>
              <Button onClick={handleAddDoc} disabled={!newDoc.title || !newDoc.url} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Document
              </Button>

              <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto space-y-2">
                {loadingDocs ? <p className="text-sm text-center">Loading...</p> : projectDocs.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground">No documents found.</p>
                ) : (
                  projectDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <button
                            className="text-xs text-blue-500 hover:underline flex items-center"
                            onClick={async () => {
                              try {
                                const blob = await projectService.downloadDocument(doc.id);
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
                              } catch (error: any) {
                                toast({ title: "Download failed", description: error.message, variant: "destructive" });
                              }
                            }}
                          >
                            Open / Download <ExternalLink className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-muted-foreground mt-1">
                Click "New Project" to create your first project
              </p>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getProjectColor(index)}`}>
                        <FolderKanban className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                          <span>{project.organization?.name || "No Organization"}</span>
                          <span>{project.currency} {project.budget?.toLocaleString() || "No budget"}</span>
                        </div>
                      </div>
                    </div>

                    {(user?.roles?.includes('ORG_ADMIN') || user?.roles?.includes('PROJECT_MANAGER')) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDocsDialog(project)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Manage Documents
                          </DropdownMenuItem>

                          {user?.roles?.includes('ORG_ADMIN') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(project)}>
                                <Power className="w-4 h-4 mr-2" />
                                {project.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteProject(project)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Project
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        <MoreVertical className="w-4 h-4 opacity-50" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString()
                          : "No start date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : "No end date"}
                      </span>
                    </div>
                  </div>

                  <Badge variant={project.isActive ? "default" : "secondary"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
                <CardFooter>
                  <Link to={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout >
  );
};

export default Projects;
