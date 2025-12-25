import { api } from '@/lib/api';
import { User } from './userService';

export interface TeamMember {
    id: number;
    organizationId: number;
    userId: number;
    role: string;
    joinedAt: string;
    user?: User;
}

export interface OrganizationMemberDetail {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    roles: string[];
    phone?: string;
    profileImageUrl?: string;
    isActive: boolean;
    organizationRole?: string;
    joinedAt?: string;
}

export interface AddMemberToOrgRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    role: string;
}

export const teamService = {
    // Get all members of an organization
    async getOrganizationMembers(organizationId: number): Promise<User[]> {
        return await api.get(`/api/organizations/${organizationId}/members`);
    },

    // Get members by role within an organization
    async getOrganizationMembersByRole(organizationId: number, role: string): Promise<User[]> {
        return await api.get(`/api/organizations/${organizationId}/members/role/${role}`);
    },

    // Add an existing user to an organization
    async addMemberToOrganization(organizationId: number, userId: number, role: string = 'TEAM_MEMBER'): Promise<TeamMember> {
        return await api.post(`/api/organizations/${organizationId}/members/${userId}?role=${role}`, {});
    },

    // Remove a member from an organization
    async removeMemberFromOrganization(organizationId: number, userId: number): Promise<void> {
        return await api.del(`/api/organizations/${organizationId}/members/${userId}`);
    },

    // Create a new user and add them to the organization
    async createAndAddMember(organizationId: number, memberData: AddMemberToOrgRequest): Promise<User> {
        return await api.post(`/api/team/organizations/${organizationId}/members`, memberData);
    },
};
