package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.Task;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateTaskRequest;
import org.flow.flowbackend.payload.request.UpdateTaskRequest;
import org.flow.flowbackend.payload.response.TaskDTO;
import org.flow.flowbackend.repository.TaskCommentRepository;
import org.flow.flowbackend.repository.TaskRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.flow.flowbackend.repository.ProjectMemberRepository;
import org.flow.flowbackend.model.ProjectMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final NotificationService notificationService;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmailService emailService;
    private final SystemSettingsService systemSettingsService;

    @Autowired
    public TaskService(TaskRepository taskRepository, 
                       ProjectService projectService,
                       UserRepository userRepository,
                       TaskCommentRepository taskCommentRepository,
                       NotificationService notificationService,
                       ProjectMemberRepository projectMemberRepository,
                       EmailService emailService,
                       SystemSettingsService systemSettingsService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userRepository = userRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.notificationService = notificationService;
        this.projectMemberRepository = projectMemberRepository;
        this.emailService = emailService;
        this.systemSettingsService = systemSettingsService;
    }

    @Transactional
    public TaskDTO createTask(CreateTaskRequest request, User currentUser) {
        Project project = projectService.getProjectById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Check Task Limit
        int maxTasks = systemSettingsService.getMaxTasksPerProject();
        if (taskRepository.countByProject(project) >= maxTasks) {
            throw new RuntimeException("Maximum number of tasks (" + maxTasks + ") reached for this project.");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : "medium")
                .status("todo")
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .project(project)
                .createdBy(currentUser)
                .createdAt(OffsetDateTime.now())
                .orderIndex(0)
                .build();

        // Assign user if specified
        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
            task.setAssignedTo(assignee);

            // Check if user is a member of the project, if not add them
            boolean isMember = projectMemberRepository.findByUser(assignee).stream()
                    .anyMatch(pm -> pm.getProject().getId().equals(project.getId()));
            
            // Also check if they are the PM or Creator (implied membership)
            boolean isManager = project.getProjectManager() != null && project.getProjectManager().getId().equals(assignee.getId());
            boolean isCreator = project.getCreatedBy().getId().equals(assignee.getId());

            if (!isMember && !isManager && !isCreator) {
                ProjectMember newMember = ProjectMember.builder()
                        .project(project)
                        .user(assignee)
                        .role("TEAM_MEMBER")
                        .joinedAt(OffsetDateTime.now())
                        .build();
                projectMemberRepository.save(newMember);
                
                // Notify via email
                emailService.sendProjectAssignmentEmail(assignee, project, "TEAM_MEMBER");
            }
        }

        Task savedTask = taskRepository.save(task);

        // Trigger TASK_ASSIGNED notification
        if (savedTask.getAssignedTo() != null && !savedTask.getAssignedTo().getId().equals(currentUser.getId())) {
            notificationService.createNotification(
                savedTask.getAssignedTo(),
                NotificationService.EVENT_TASK_ASSIGNED,
                "New task assigned",
                "You have been assigned to '" + savedTask.getTitle() + "'",
                "TASK",
                savedTask.getId()
            );
        }

        return convertToDTO(savedTask);
    }

    public Optional<TaskDTO> getTaskDTOById(Long id) {
        return taskRepository.findById(id).map(this::convertToDTO);
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public List<TaskDTO> getTasksByProject(Long projectId) {
        Project project = projectService.getProjectById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        return taskRepository.findByProject(project)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByUser(User user) {
        List<Task> assignedOrCreated = taskRepository.findByAssignedToOrCreatedBy(user, user);
        List<Task> managedProjectTasks = taskRepository.findByProject_ProjectManager(user);

        java.util.Set<Task> allTasks = new java.util.HashSet<>(assignedOrCreated);
        allTasks.addAll(managedProjectTasks);

        // Strict Access Control: Filter out tasks from inactive organizations unless SUPER_ADMIN
        boolean isSuperAdmin = user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN");

        return allTasks.stream()
                .filter(t -> isSuperAdmin || (t.getProject() != null && t.getProject().getOrganization() != null && t.getProject().getOrganization().isActive()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByStatus(String status) {
        return taskRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskDTO updateTask(Long id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getEstimatedHours() != null) {
            task.setEstimatedHours(request.getEstimatedHours());
        }
        if (request.getActualHours() != null) {
            task.setActualHours(request.getActualHours());
        }
        if (request.getOrderIndex() != null) {
            task.setOrderIndex(request.getOrderIndex());
        }
        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
            task.setAssignedTo(assignee);
        }

        task.setUpdatedAt(OffsetDateTime.now());
        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        String oldStatus = task.getStatus();
        task.setStatus(status);
        task.setUpdatedAt(OffsetDateTime.now());
        Task savedTask = taskRepository.save(task);

        // Trigger TASK_COMPLETED notification when status changes to 'done'
        if ("done".equalsIgnoreCase(status) && !"done".equalsIgnoreCase(oldStatus)) {
            // Notify Project Manager
            if (savedTask.getProject() != null && savedTask.getProject().getProjectManager() != null) {
                notificationService.createNotification(
                    savedTask.getProject().getProjectManager(),
                    NotificationService.EVENT_TASK_COMPLETED,
                    "Task completed",
                    "'" + savedTask.getTitle() + "' has been completed",
                    "TASK",
                    savedTask.getId()
                );
            }
        }

        return convertToDTO(savedTask);
    }

    @Transactional
    public TaskDTO assignTask(Long id, Long userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        if (userId != null) {
            User assignee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            task.setAssignedTo(assignee);
        } else {
            task.setAssignedTo(null);
        }
        
        task.setUpdatedAt(OffsetDateTime.now());
        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found");
        }
        taskRepository.deleteById(id);
    }

    public TaskDTO convertToDTO(Task task) {
        TaskDTO dto = TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .orderIndex(task.getOrderIndex())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();

        // Project info
        if (task.getProject() != null) {
            dto.setProjectId(task.getProject().getId());
            dto.setProjectName(task.getProject().getName());
        }

        // Assigned user info
        if (task.getAssignedTo() != null) {
            dto.setAssignedToId(task.getAssignedTo().getId());
            dto.setAssignedToName(task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName());
            dto.setAssignedToEmail(task.getAssignedTo().getEmail());
        }

        // Created by info
        if (task.getCreatedBy() != null) {
            dto.setCreatedById(task.getCreatedBy().getId());
            dto.setCreatedByName(task.getCreatedBy().getFirstName() + " " + task.getCreatedBy().getLastName());
        }

        // Parent task
        if (task.getParentTask() != null) {
            dto.setParentTaskId(task.getParentTask().getId());
        }

        // Comment count
        dto.setCommentCount(taskCommentRepository.countByTaskId(task.getId()));

        return dto;
    }
}