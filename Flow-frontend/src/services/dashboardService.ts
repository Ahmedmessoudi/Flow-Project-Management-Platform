import { api } from '@/lib/api';

export interface DashboardStats {
    // Common stats
    activeProjects: number;
    totalTasks?: number;
    completedTasks: number;
    role: string;

    // Super Admin
    totalOrganizations?: number;
    totalUsers?: number;
    totalProjects?: number;
    activeOrganizations?: number;
    systemHealth?: string;

    // Org Admin / PM
    teamMembers?: number;
    overdueTasks?: number;
    inProgressTasks?: number;

    // Team Member
    assignedTasks?: number;
    todoTasks?: number;
    dueSoon?: number;

    // Client
    completionRate?: string;
}

export interface DashboardActivity {
    type: string;
    title: string;
    time: string;
    projectName?: string;
}

export interface DashboardDeadline {
    task: string;
    project: string;
    date: string;
    taskId: number;
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        return await api.get('/api/dashboard/stats');
    },

    async getRecentActivities(): Promise<DashboardActivity[]> {
        return await api.get('/api/dashboard/activities');
    },

    async getUpcomingDeadlines(): Promise<DashboardDeadline[]> {
        return await api.get('/api/dashboard/deadlines');
    },
};
