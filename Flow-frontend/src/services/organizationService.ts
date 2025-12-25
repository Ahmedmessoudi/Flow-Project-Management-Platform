import { api } from '@/lib/api';
import { User } from './userService';

export interface Organization {
    id: number;
    name: string;
    description?: string;
    orgAdminId?: number;
    orgAdminName?: string;
    orgAdminEmail?: string;
    projectCount: number;
    memberCount: number;
    isActive: boolean;
    createdById: number;
    createdByName: string;
    createdByRoles: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface CreateOrganizationData {
    name: string;
    description?: string;
    orgAdminId: number;
}

export interface UpdateOrganizationData {
    name?: string;
    description?: string;
    orgAdminId?: number;
    isActive?: boolean;
}

export const organizationService = {
    async getAllOrganizations(): Promise<Organization[]> {
        return await api.get('/api/organizations');
    },

    async getAllOrganizationsForManagement(): Promise<Organization[]> {
        return await api.get('/api/organizations/all');
    },

    async getOrganizationById(id: number): Promise<Organization> {
        return await api.get(`/api/organizations/${id}`);
    },

    async getOrganizationMembers(id: number): Promise<User[]> {
        return await api.get(`/api/organizations/${id}/members`);
    },

    async createOrganization(data: CreateOrganizationData): Promise<Organization> {
        return await api.post('/api/organizations', data);
    },

    async updateOrganization(id: number, data: UpdateOrganizationData): Promise<Organization> {
        return await api.put(`/api/organizations/${id}`, data);
    },

    async deleteOrganization(id: number): Promise<void> {
        return await api.del(`/api/organizations/${id}`);
    },
};
