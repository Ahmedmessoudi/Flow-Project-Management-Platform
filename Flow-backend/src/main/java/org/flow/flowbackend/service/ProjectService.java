package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationService organizationService;
    private final org.flow.flowbackend.repository.ProjectMemberRepository projectMemberRepository;
    private final org.flow.flowbackend.repository.UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final SystemSettingsService systemSettingsService;

    @Autowired
    public ProjectService(ProjectRepository projectRepository, 
                          OrganizationService organizationService,
                          org.flow.flowbackend.repository.ProjectMemberRepository projectMemberRepository,
                          org.flow.flowbackend.repository.UserRepository userRepository,
                          EmailService emailService,
                          NotificationService notificationService,
                          SystemSettingsService systemSettingsService) {
        this.projectRepository = projectRepository;
        this.organizationService = organizationService;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.systemSettingsService = systemSettingsService;
    }

    @Transactional
    public Project createProject(org.flow.flowbackend.payload.request.CreateProjectRequest request, Long organizationId, User currentUser) {
        Organization organization = organizationService.getOrganizationEntityById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Check Project Limit
        int maxProjects = systemSettingsService.getMaxProjectsPerOrganization();
        if (projectRepository.countByOrganization(organization) >= maxProjects) {
            throw new RuntimeException("Maximum number of projects (" + maxProjects + ") reached for this organization.");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organization(organization)
                .createdBy(currentUser)
                .isActive(true)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .createdAt(java.time.OffsetDateTime.now())
                .build();

        // Set Project Manager if provided
        if (request.getProjectManagerId() != null) {
            User pm = userRepository.findById(request.getProjectManagerId())
                    .orElseThrow(() -> new RuntimeException("Project Manager not found"));
            project.setProjectManager(pm);
        }

        Project savedProject = projectRepository.save(project);

        // Add Members if provided
        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            List<User> members = userRepository.findAllById(request.getMemberIds());
            for (User member : members) {
                org.flow.flowbackend.model.ProjectMember projectMember = org.flow.flowbackend.model.ProjectMember.builder()
                        .project(savedProject)
                        .user(member)
                        .role("TEAM_MEMBER")
                        .joinedAt(java.time.OffsetDateTime.now())
                        .build();
                projectMemberRepository.save(projectMember);
                
                // Send project assignment email
                emailService.sendProjectAssignmentEmail(member, savedProject, "TEAM_MEMBER");
            }
        }

        return savedProject;
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public List<Project> getProjectsByOrganization(Long organizationId) {
        Organization organization = organizationService.getOrganizationEntityById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return projectRepository.findByOrganization(organization);
    }

    @Transactional(readOnly = true)
    public List<Project> getProjectsByUser(User user) {
        boolean isSuperAdmin = user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN");
        
        // SUPER_ADMIN only sees projects from the "Flow" organization
        if (isSuperAdmin) {
            return projectRepository.findAll().stream()
                    .filter(p -> p.getOrganization() != null && "Flow".equalsIgnoreCase(p.getOrganization().getName()))
                    .collect(java.util.stream.Collectors.toList());
        }

        // 1. Projects created by user
        List<Project> createdProjects = projectRepository.findByCreatedBy(user);
        
        // 2. Projects where user is Project Manager
        List<Project> managedProjects = projectRepository.findByProjectManager(user);
        
        // 3. Projects where user is a Member
        List<org.flow.flowbackend.model.ProjectMember> memberships = projectMemberRepository.findByUser(user);
        List<Project> memberProjects = memberships.stream()
                .map(org.flow.flowbackend.model.ProjectMember::getProject)
                .collect(java.util.stream.Collectors.toList());

        // Combine and deduplicate
        java.util.Set<Project> allProjects = new java.util.HashSet<>();
        allProjects.addAll(createdProjects);
        allProjects.addAll(managedProjects);
        allProjects.addAll(memberProjects);

        // Filter out projects from deactivated organizations
        return allProjects.stream()
                .filter(p -> p.getOrganization() != null && p.getOrganization().isActive())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setName(projectDetails.getName());
        project.setDescription(projectDetails.getDescription());
        project.setActive(projectDetails.isActive());
        project.setBudget(projectDetails.getBudget());
        project.setCurrency(projectDetails.getCurrency());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());

        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProjectStatus(Long id, boolean isActive) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setActive(isActive);
        Project savedProject = projectRepository.save(project);

        // Notify members
        List<User> members = getProjectMembers(id);
        String statusMsg = isActive ? "Active" : "Inactive";
        for (User member : members) {
            emailService.sendProjectStatusChangeEmail(member.getEmail(), member.getFirstName(), project.getName(), isActive);
            
            // In-app notification
            notificationService.createNotification(
                member,
                "PROJECT_STATUS_CHANGE",
                "Project Status Updated",
                "Project '" + project.getName() + "' is now " + statusMsg,
                "PROJECT",
                project.getId()
            );
        }

        return savedProject;
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Notify members before deletion
        List<User> members = getProjectMembers(id);
        String projectName = project.getName();
        
        projectRepository.delete(project);
        
        for (User member : members) {
            emailService.sendProjectDeletionEmail(member.getEmail(), member.getFirstName(), projectName);
        }
    }
    @Transactional(readOnly = true)
    public List<User> getProjectMembers(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<User> members = new java.util.ArrayList<>(projectMemberRepository.findByProject(project).stream()
                .map(org.flow.flowbackend.model.ProjectMember::getUser)
                .collect(java.util.stream.Collectors.toList()));
        
        // Add Project Manager if not already in the list
        if (project.getProjectManager() != null) {
            final Long pmId = project.getProjectManager().getId();
            boolean pmExists = members.stream()
                    .anyMatch(m -> m.getId().equals(pmId));
            if (!pmExists) {
                members.add(project.getProjectManager());
            }
        }
        
        return members;
    }

    @Transactional
    public void addMember(Long projectId, Long userId, String role) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if already a member
        boolean isMember = projectMemberRepository.findByProject(project).stream()
                .anyMatch(pm -> pm.getUser().getId().equals(userId));
                
        if (isMember) {
            return;
        }

        // Check Member Limit
        int maxMembers = systemSettingsService.getMaxMembersPerProject();
        if (projectMemberRepository.countByProject(project) >= maxMembers) {
            throw new RuntimeException("Maximum number of members (" + maxMembers + ") reached for this project.");
        }

        org.flow.flowbackend.model.ProjectMember projectMember = org.flow.flowbackend.model.ProjectMember.builder()
                .project(project)
                .user(user)
                .role(role != null ? role : "TEAM_MEMBER")
                .joinedAt(java.time.OffsetDateTime.now())
                .build();
        
        projectMemberRepository.save(projectMember);
        
        // Send email
        emailService.sendProjectAssignmentEmail(user, project, role);

        // Notify
        notificationService.createNotification(
            user,
            "PROJECT_ASSIGNMENT",
            "Added to Project",
            "You have been added to project '" + project.getName() + "' as " + role,
            "PROJECT",
            project.getId()
        );
    }
    
    @Transactional
    public void sendClientFeedback(Long projectId, String feedbackType, String message, User client) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User pm = project.getProjectManager();
        if (pm == null) {
            // Fallback to Org Admin or just log/error? For now just return if no PM
            return;
        }

        String title = "Client Feedback: " + feedbackType;
        String content = "Client " + client.getFirstName() + " " + client.getLastName() + 
                         " has sent feedback for project '" + project.getName() + "'.\n" +
                         "Type: " + feedbackType + "\n" +
                         "Message: " + (message != null ? message : "No message");

        // Send Email
        // emailService.sendFeedbackEmail(pm, project, feedbackType, message); // if we had this method

        // Send In-App Notification
        notificationService.createNotification(
            pm,
            "CLIENT_FEEDBACK",
            title,
            content,
            "PROJECT",
            project.getId()
        );
    }
}