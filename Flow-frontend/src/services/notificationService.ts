import { api } from '@/lib/api';

export interface NotificationEvent {
    id: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    isRead: boolean;
    createdAt: string;
}

export interface WebhookConfig {
    id?: number;
    organizationId: number;
    webhookUrl: string;
    secretKey?: string;
    isActive: boolean;
    eventTypes: string[];
    targetRoles: string[];
}

export const notificationService = {
    async getNotifications(): Promise<NotificationEvent[]> {
        return await api.get('/api/notifications');
    },

    async getUnreadNotifications(): Promise<NotificationEvent[]> {
        return await api.get('/api/notifications/unread');
    },

    async getUnreadCount(): Promise<{ count: number }> {
        return await api.get('/api/notifications/unread/count');
    },

    async markAsRead(id: number): Promise<void> {
        return await api.patch(`/api/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
        return await api.patch('/api/notifications/read-all');
    },

    // Webhook Config
    async getWebhookConfig(organizationId: number): Promise<WebhookConfig | null> {
        try {
            return await api.get(`/api/notifications/webhook-config/${organizationId}`);
        } catch (error) {
            return null;
        }
    },

    async saveWebhookConfig(config: WebhookConfig): Promise<WebhookConfig> {
        return await api.post('/api/notifications/webhook-config', config);
    },
};

// Event type constants (matching backend)
export const NOTIFICATION_EVENTS = {
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    TASK_COMPLETED: 'TASK_COMPLETED',
    TASK_COMMENT: 'TASK_COMMENT',
    DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',
};
