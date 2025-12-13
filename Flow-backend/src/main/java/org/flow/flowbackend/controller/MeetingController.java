package org.flow.flowbackend.controller;

import jakarta.validation.Valid;
import org.flow.flowbackend.model.Meeting;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.MeetingRequest;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.MeetingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MeetingController {

    private final MeetingService meetingService;

    @Autowired
    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> requestMeeting(@Valid @RequestBody MeetingRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) auth.getPrincipal();

            Meeting meeting = meetingService.requestMeeting(request, user);
            return ResponseEntity.ok(meeting);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
