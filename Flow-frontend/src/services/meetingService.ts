import { api } from "@/lib/api";

export interface MeetingRequest {
    title: string;
    description: string;
    scheduledAt: string;
    projectId: number;
}

export interface Meeting {
    id: number;
    title: string;
    description: string;
    scheduledAt: string;
    requesterId: number;
    projectId: number;
    status: string;
    createdAt: string;
}

export const meetingService = {
    async requestMeeting(data: MeetingRequest): Promise<Meeting> {
        return await api.post('/api/meetings/request', data);
    }
};
