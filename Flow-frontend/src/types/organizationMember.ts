export interface OrganizationMember {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationRole: string;
    profileImageUrl?: string;
}
