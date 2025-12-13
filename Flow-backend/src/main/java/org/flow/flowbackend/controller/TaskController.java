package org.flow.flowbackend.controller;

import jakarta.validation.Valid;
import org.flow.flowbackend.model.Task;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateTaskRequest;
import org.flow.flowbackend.payload.request.UpdateTaskRequest;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.payload.response.TaskCommentDTO;
import org.flow.flowbackend.payload.response.TaskDTO;
import org.flow.flowbackend.service.TaskCommentService;
import org.flow.flowbackend.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TaskController {

    private final TaskService taskService;
    private final TaskCommentService taskCommentService;

    @Autowired
    public TaskController(TaskService taskService, TaskCommentService taskCommentService) {
        this.taskService = taskService;
        this.taskCommentService = taskCommentService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(taskService.createTask(request, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<TaskDTO>> getTasksByUser(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(taskService.getTasksByUser(currentUser));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER') or hasAuthority('CLIENT')")
    public ResponseEntity<List<TaskDTO>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<TaskDTO>> getTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER') or hasAuthority('CLIENT')")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        return taskService.getTaskDTOById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody UpdateTaskRequest request) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            String status = statusUpdate.get("status");
            if (status == null) {
                throw new IllegalArgumentException("Status is required");
            }
            return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> assignTask(
            @PathVariable Long id,
            @RequestBody Map<String, Long> assignment) {
        try {
            Long userId = assignment.get("userId");
            return ResponseEntity.ok(taskService.assignTask(id, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<MessageResponse> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(new MessageResponse("Task deleted successfully!"));
    }

    // Comment endpoints
    
    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> commentData,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            String content = commentData.get("content");
            if (content == null || content.trim().isEmpty()) {
                throw new IllegalArgumentException("Comment content is required");
            }
            return ResponseEntity.ok(taskCommentService.addComment(id, currentUser.getId(), content));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER') or hasAuthority('CLIENT')")
    public ResponseEntity<List<TaskCommentDTO>> getTaskComments(@PathVariable Long id) {
        return ResponseEntity.ok(taskCommentService.getCommentsByTask(id));
    }
    
    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<MessageResponse> deleteComment(@PathVariable Long commentId) {
        try {
            taskCommentService.deleteComment(commentId);
            return ResponseEntity.ok(new MessageResponse("Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}