package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> createProject(
            @RequestBody org.flow.flowbackend.payload.request.CreateProjectRequest request,
            @RequestParam Long organizationId,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(projectService.createProject(request, organizationId, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER') or hasAuthority('CLIENT')")
    public ResponseEntity<List<Project>> getProjectsByUser(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(projectService.getProjectsByUser(currentUser));
    }

    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<Project>> getProjectsByOrganization(@PathVariable Long organizationId) {
        return ResponseEntity.ok(projectService.getProjectsByOrganization(organizationId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER') or hasAuthority('CLIENT')")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> updateProject(
            @PathVariable Long id,
            @RequestBody Project projectDetails) {
        try {
            return ResponseEntity.ok(projectService.updateProject(id, projectDetails));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> updateProjectStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> statusUpdate) {
        try {
            if (!statusUpdate.containsKey("isActive")) {
                return ResponseEntity.badRequest().body(new MessageResponse("isActive field is required"));
            }
            boolean isActive = statusUpdate.get("isActive");
            return ResponseEntity.ok(projectService.updateProjectStatus(id, isActive));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<MessageResponse> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(new MessageResponse("Project deleted successfully!"));
    }
    @GetMapping("/{id}/members")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<User>> getProjectMembers(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectMembers(id));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> addMember(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String role = (String) request.get("role");
            projectService.addMember(id, userId, role);
            return ResponseEntity.ok(new MessageResponse("Member added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<?> sendClientFeedback(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> feedbackData,
            Authentication authentication) {
        try {
            User client = (User) authentication.getPrincipal();
            String type = feedbackData.get("type");
            String message = feedbackData.get("message");
            
            projectService.sendClientFeedback(id, type, message, client);
            return ResponseEntity.ok(new MessageResponse("Feedback sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}