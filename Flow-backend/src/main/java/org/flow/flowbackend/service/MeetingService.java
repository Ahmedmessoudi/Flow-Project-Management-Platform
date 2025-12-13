package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Meeting;
import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.MeetingRequest;
import org.flow.flowbackend.repository.MeetingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ProjectService projectService;
    private final NotificationService notificationService;

    @Autowired
    public MeetingService(MeetingRepository meetingRepository, ProjectService projectService, NotificationService notificationService) {
        this.meetingRepository = meetingRepository;
        this.projectService = projectService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Meeting requestMeeting(MeetingRequest request, User requester) {
        Project project = projectService.getProjectById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Meeting meeting = Meeting.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .scheduledAt(request.getScheduledAt())
                .requester(requester)
                .project(project)
                .status("PENDING")
                .build();

        Meeting savedMeeting = meetingRepository.save(meeting);

        // Notify Project Manager with full meeting details
        if (project.getProjectManager() != null) {
            String requesterName = requester.getFirstName() + " " + requester.getLastName();
            String scheduledDateStr = request.getScheduledAt() != null 
                ? request.getScheduledAt().toString() 
                : "Not specified";
            
            String fullMessage = "Meeting Request from: " + requesterName + "\n\n" +
                    "Title: " + request.getTitle() + "\n" +
                    "Project: " + project.getName() + "\n" +
                    "Scheduled: " + scheduledDateStr + "\n\n" +
                    "Description:\n" + (request.getDescription() != null && !request.getDescription().isEmpty() 
                        ? request.getDescription() 
                        : "No description provided");
            
            notificationService.createNotification(
                    project.getProjectManager(),
                    "MEETING_REQUEST",
                    "Meeting Request: " + request.getTitle(),
                    fullMessage,
                    "MEETING",
                    savedMeeting.getId()
            );
        }

        return savedMeeting;
    }
}
