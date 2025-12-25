import { api } from '@/lib/api';

export interface SmtpConfig {
    host: string;
    port: string;
    username: string;
    password: string;
    from: string;
    welcomeTemplate?: string;
    notificationTemplate?: string;
}

export interface SystemLimits {
    maxUsersPerOrganization: number;
    maxProjectsPerOrganization: number;
    maxMembersPerProject: number;
    maxTasksPerProject: number;
}

export const settingsService = {
    async getEmailConfig(): Promise<SmtpConfig> {
        return await api.get('/api/email/config');
    },

    async saveEmailConfig(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
        return await api.post('/api/email/config', config);
    },

    async sendTestEmail(email: string): Promise<{ success: boolean; message: string }> {
        return await api.post('/api/email/test', { email });
    },

    async getSystemLimits(): Promise<SystemLimits> {
        return await api.get('/api/settings/limits');
    },

    async saveSystemLimits(limits: SystemLimits): Promise<{ success: boolean; message: string }> {
        return await api.post('/api/settings/limits', limits);
    },
};
