import { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Project {
  id: string;
  name: string;
  client: string;
  organization: string;
  manager: string;
  status: "planning" | "active" | "on_hold" | "completed";
  progress: number;
  budget: string;
  startDate: string;
  endDate: string;
  teamSize: number;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedByRole?: string;
  modifiedAt?: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    client: "Acme Corp",
    organization: "Tech Corp",
    manager: "Jane Smith",
    status: "active",
    progress: 65,
    budget: "$50,000",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    teamSize: 8,
    createdBy: "John Doe",
    createdByRole: "ORG_ADMIN",
    createdAt: "2023-12-15",
    modifiedBy: "Jane Smith",
    modifiedByRole: "PROJECT_MANAGER",
    modifiedAt: "2024-01-20",
  },
  {
    id: "2",
    name: "Platform Development",
    client: "TechStart Inc",
    organization: "Tech Corp",
    manager: "Mike Johnson",
    status: "active",
    progress: 45,
    budget: "$120,000",
    startDate: "2023-11-01",
    endDate: "2024-06-30",
    teamSize: 12,
    createdBy: "John Doe",
    createdByRole: "ORG_ADMIN",
    createdAt: "2023-10-20",
  },
  {
    id: "3",
    name: "Mobile App Launch",
    client: "RetailPro",
    organization: "Tech Corp",
    manager: "Sarah Chen",
    status: "planning",
    progress: 15,
    budget: "$80,000",
    startDate: "2024-02-15",
    endDate: "2024-08-31",
    teamSize: 6,
    createdBy: "Admin User",
    createdByRole: "SUPER_ADMIN",
    createdAt: "2024-01-10",
  },
];

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "on_hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
            <p className="text-muted-foreground mt-2">
              Oversee all projects, budgets, and timelines
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>
                  Create a new project with budget, timeline, and team assignments
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input id="project-name" placeholder="Enter project name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Project description and objectives"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-client">Client</Label>
                    <Input id="project-client" placeholder="Client name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-org">Organization</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech-corp">Tech Corp</SelectItem>
                        <SelectItem value="design-studio">Design Studio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-manager">Project Manager</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jane">Jane Smith</SelectItem>
                        <SelectItem value="mike">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-budget">Budget</Label>
                    <Input id="project-budget" placeholder="$0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-start">Start Date</Label>
                    <Input id="project-start" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-end">End Date</Label>
                    <Input id="project-end" type="date" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.teamSize} members
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.client}</TableCell>
                  <TableCell>{project.manager}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[100px]">
                      <Progress value={project.progress} />
                      <div className="text-xs text-muted-foreground">
                        {project.progress}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{project.budget}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{project.startDate}</div>
                      <div className="text-muted-foreground">{project.endDate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{project.createdBy}</div>
                      <div className="text-muted-foreground text-xs">
                        {project.createdByRole} • {project.createdAt}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.modifiedBy ? (
                      <div className="text-sm">
                        <div className="font-medium">{project.modifiedBy}</div>
                        <div className="text-muted-foreground text-xs">
                          {project.modifiedByRole} • {project.modifiedAt}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectManagement;
