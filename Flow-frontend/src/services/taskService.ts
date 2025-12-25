import { api } from "@/lib/api";

export interface TaskComment {
    id: number;
    content: string;
    userId: number;
    userName: string;
    userEmail: string;
    createdAt: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    status: "todo" | "in_progress" | "review" | "completed" | "blocked";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string;
    estimatedHours?: number;
    actualHours?: number;
    orderIndex: number;

    // Project info
    projectId: number;
    projectName: string;

    // Assigned user info
    assignedToId?: number;
    assignedToName?: string;
    assignedToEmail?: string;

    // Created by info
    createdById: number;
    createdByName: string;

    // Comments
    commentCount: number;

    createdAt: string;
    updatedAt?: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    estimatedHours?: number;
    assignedToId?: number;
    projectId: number;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    assignedToId?: number;
    orderIndex?: number;
}

export const taskService = {
    async getTasksByUser(): Promise<Task[]> {
        return await api.get('/api/tasks');
    },

    async getTasksByProject(projectId: number): Promise<Task[]> {
        return await api.get(`/api/tasks/project/${projectId}`);
    },

    async getTasksByStatus(status: string): Promise<Task[]> {
        return await api.get(`/api/tasks/status/${status}`);
    },

    async getTaskById(id: number): Promise<Task> {
        return await api.get(`/api/tasks/${id}`);
    },

    async createTask(data: CreateTaskData): Promise<Task> {
        return await api.post('/api/tasks', data);
    },

    async updateTask(id: number, data: UpdateTaskData): Promise<Task> {
        return await api.put(`/api/tasks/${id}`, data);
    },

    async updateTaskStatus(id: number, status: string): Promise<Task> {
        return await api.patch(`/api/tasks/${id}/status`, { status });
    },

    async assignTask(id: number, userId: number | null): Promise<Task> {
        return await api.patch(`/api/tasks/${id}/assign`, { userId });
    },

    async deleteTask(id: number): Promise<void> {
        return await api.del(`/api/tasks/${id}`);
    },

    // Comment methods
    async getTaskComments(taskId: number): Promise<TaskComment[]> {
        return await api.get(`/api/tasks/${taskId}/comments`);
    },

    async addTaskComment(taskId: number, content: string): Promise<TaskComment> {
        return await api.post(`/api/tasks/${taskId}/comments`, { content });
    },

    async deleteComment(commentId: number): Promise<void> {
        return await api.del(`/api/tasks/comments/${commentId}`);
    }
};
