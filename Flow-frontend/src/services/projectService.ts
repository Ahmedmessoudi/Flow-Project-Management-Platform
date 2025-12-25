import { api } from '@/lib/api';
import { User } from './userService';

export interface Project {
    id: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    budget?: number;
    currency: string;
    organization?: { id: number; name: string };
    organizationId?: number;
    createdById?: number;
    createdAt: string;
    updatedAt?: string;
    projectManager?: User;
}

export interface CreateProjectData {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency?: string;
    projectManagerId?: number;
    memberIds?: number[];
}

export interface UpdateProjectData {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    budget?: number;
    currency?: string;
}

export interface ProjectDocument {
    id: number;
    title: string;
    type: string;
    fileName?: string;
    contentType?: string;
    size?: number;
    data?: string; // base64 from backend
    projectId: number;
    uploadedAt: string;
}

export const projectService = {
    async getAllProjects(): Promise<Project[]> {
        return await api.get('/api/projects');
    },

    async getProjectById(id: number): Promise<Project> {
        return await api.get(`/api/projects/${id}`);
    },

    async getProjectsByOrganization(organizationId: number): Promise<Project[]> {
        return await api.get(`/api/projects/organization/${organizationId}`);
    },

    async createProject(data: CreateProjectData, organizationId: number): Promise<Project> {
        return await api.post(`/api/projects?organizationId=${organizationId}`, data);
    },

    async updateProjectStatus(id: number, isActive: boolean): Promise<Project> {
        return await api.patch(`/api/projects/${id}/status`, { isActive });
    },

    async updateProject(id: number, data: UpdateProjectData): Promise<Project> {
        return await api.put(`/api/projects/${id}`, data);
    },

    async deleteProject(id: number): Promise<void> {
        return await api.del(`/api/projects/${id}`);
    },

    getProjectMembers: async (projectId: number): Promise<User[]> => {
        const response = await api.get(`/api/projects/${projectId}/members`);
        return response as User[];
    },

    async addMember(projectId: number, userId: number, role: string): Promise<void> {
        await api.post(`/api/projects/${projectId}/members`, { userId, role });
    },

    async getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
        return await api.get(`/api/projects/${projectId}/documents`);
    },

    async downloadDocument(documentId: number): Promise<Blob> {
        const token = localStorage.getItem('jwtToken');
        const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
        const res = await fetch(`${API_BASE}/api/projects/documents/${documentId}/download`, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Download failed');
        }
        return await res.blob();
    },

    async addDocument(projectId: number, payload: {
        title: string;
        type: string;
        data?: string;
        fileName?: string;
        contentType?: string;
        size?: number;
    }): Promise<ProjectDocument> {
        return await api.post(`/api/projects/${projectId}/documents`, payload);
    },

    async deleteDocument(documentId: number): Promise<void> {
        return await api.del(`/api/projects/documents/${documentId}`);
    },

    async notifyDocuments(projectId: number, documentIds: number[]): Promise<void> {
        return await api.post(`/api/projects/${projectId}/documents/notify`, documentIds);
    },

    async sendFeedback(projectId: number, type: 'APPROVE' | 'DISAPPROVE' | 'REQUEST_CHANGES', message: string): Promise<void> {
        return await api.post(`/api/projects/${projectId}/feedback`, { type, message });
    },
};
