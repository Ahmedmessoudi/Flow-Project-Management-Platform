import { api } from '@/lib/api';

export interface UserOrganization {
    id: number;
    name: string;
    role: string;
}

export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles?: string[];
    projectId?: number;
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    roles?: string[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    profileImageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    roles: string[];
    organizations?: UserOrganization[];
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    level?: number;
}

export const userService = {
    async getAllUsers(): Promise<User[]> {
        return await api.get('/api/users');
    },

    async getUserById(id: number): Promise<User> {
        return await api.get(`/api/users/${id}`);
    },

    async createUser(data: CreateUserData): Promise<User> {
        return await api.post('/api/users', data);
    },

    async updateUser(id: number, data: UpdateUserData): Promise<User> {
        return await api.put(`/api/users/${id}`, data);
    },

    async deleteUser(id: number): Promise<void> {
        return await api.del(`/api/users/${id}`);
    },

    async getUsersByRole(roleName: string): Promise<User[]> {
        return await api.get(`/api/users/role/${roleName}`);
    },

    async getAllRoles(): Promise<Role[]> {
        try {
            const res = await api.get('/api/users/roles');
            if (res && Array.isArray(res) && res.length > 0) return res;
        } catch (e) {
            // ignore and fall back to defaults
        }

        // Fallback static roles
        return [
            { id: 1, name: 'SUPER_ADMIN', description: 'System administrator', level: 1 },
            { id: 2, name: 'ORG_ADMIN', description: 'Organization admin', level: 2 },
            { id: 3, name: 'PROJECT_MANAGER', description: 'Project manager', level: 3 },
            { id: 4, name: 'TEAM_MEMBER', description: 'Team member', level: 4 },
            { id: 5, name: 'CLIENT', description: 'Client user', level: 5 },
        ];
    },

    async resetPassword(newPassword: string): Promise<void> {
        return await api.post('/api/users/reset-password', { newPassword });
    },

    async updateUserStatus(id: number, isActive: boolean): Promise<User> {
        return await api.patch(`/api/users/${id}/status`, { isActive });
    },
};
