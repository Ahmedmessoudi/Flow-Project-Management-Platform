import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Briefcase, Crown, UserCheck, Calendar } from "lucide-react";
import { projectService, Project } from "@/services/projectService";
import { User } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectWithMembers extends Project {
    members: User[];
}

const ProjectTeam = () => {
    const { user } = useAuth();
    const [projectsWithMembers, setProjectsWithMembers] = useState<ProjectWithMembers[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch projects for the user (as PM, this gets managed projects + others)
            const projects = await projectService.getAllProjects();

            // Filter primarily for projects where the user is the manager, or just show all accessible ones.
            // The user asked to see members of "their projects". Usually implies managed projects.
            // But let's show all projects they have access to, or maybe just managed ones?
            // "group by project" implies showing the project container.
            // Let's filter for projects where user is creator or manager if possible, or just all they see.
            // To strictly follow "his projects" (managed):
            const managedProjects = projects.filter(p =>
                p.projectManager?.id === user?.id ||
                // Or if they are simply a member, they might want to see the team too?
                // Use case says "project manager... see members... of his projects". 
                // We will show all projects returned by getProjectsByUser, which we already fixed to include managed ones.
                true
            );


            // 2. Fetch members for each project
            const projectsWithMembersData = await Promise.all(
                managedProjects.map(async (project) => {
                    try {
                        const members = await projectService.getProjectMembers(project.id);
                        return { ...project, members };
                    } catch (error) {
                        console.error(`Failed to load members for project ${project.id}`, error);
                        return { ...project, members: [] };
                    }
                })
            );

            setProjectsWithMembers(projectsWithMembersData);
        } catch (error) {
            console.error("Failed to load project teams", error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeVariant = (roles: string[] | undefined) => {
        if (!roles || roles.length === 0) return "secondary";
        if (roles.includes("PROJECT_MANAGER")) return "default";
        if (roles.includes("CLIENT")) return "outline";
        return "secondary";
    };

    const getRoleIcon = (roles: string[] | undefined) => {
        if (!roles || roles.length === 0) return <UserCheck className="h-3 w-3" />;
        if (roles.includes("PROJECT_MANAGER")) return <Crown className="h-3 w-3" />;
        if (roles.includes("CLIENT")) return <Briefcase className="h-3 w-3" />;
        return <UserCheck className="h-3 w-3" />;
    };

    const getRoleLabel = (roles: string[] | undefined) => {
        if (!roles || roles.length === 0) return "Team Member";
        if (roles.includes("PROJECT_MANAGER")) return "Manager";
        if (roles.includes("CLIENT")) return "Client";
        if (roles.includes("TEAM_MEMBER")) return "Member";
        return roles[0];
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Project Teams</h1>
                    <p className="text-muted-foreground mt-2">
                        View team members and clients grouped by your projects
                    </p>
                </div>

                {projectsWithMembers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No projects found/assigned</h3>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {projectsWithMembers.map((project) => (
                            <Card key={project.id} className="overflow-hidden border-t-4 border-t-primary">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {project.name}
                                                {!project.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                                            </CardTitle>
                                            <CardDescription className="mt-1 line-clamp-2">
                                                {project.description || "No description provided"}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border">
                                            <Calendar className="h-4 w-4" />
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                                            {' - '}
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {project.members.length === 0 ? (
                                        <div className="text-sm text-muted-foreground italic text-center py-4">No members assigned to this project yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {project.members.map((member) => (
                                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all bg-card">
                                                    <Avatar className="h-10 w-10 border">
                                                        <AvatarImage src={member.profileImageUrl} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                    <Badge variant={getRoleBadgeVariant(member.roles)} className="ml-auto text-[10px] h-5 px-1.5 flex gap-1">
                                                        {getRoleIcon(member.roles)}
                                                        {getRoleLabel(member.roles)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default ProjectTeam;
