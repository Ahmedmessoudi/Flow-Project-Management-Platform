package org.flow.flowbackend.service;

import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.flow.flowbackend.model.Task;

@Service
public class DashboardService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Autowired
    public DashboardService(OrganizationRepository organizationRepository,
                            UserRepository userRepository,
                            ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            OrganizationMemberRepository organizationMemberRepository,
                            ProjectMemberRepository projectMemberRepository) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(User user) {
        Map<String, Object> stats = new HashMap<>();
        List<String> roles = user.getRoles();

        if (roles == null || roles.isEmpty()) {
            return getDefaultStats();
        }

        // Determine primary role (highest privilege)
        if (roles.contains("SUPER_ADMIN")) {
            return getSuperAdminStats();
        } else if (roles.contains("ORG_ADMIN")) {
            return getOrgAdminStats(user);
        } else if (roles.contains("PROJECT_MANAGER")) {
            return getProjectManagerStats(user);
        } else if (roles.contains("TEAM_MEMBER")) {
            return getTeamMemberStats(user);
        } else if (roles.contains("CLIENT")) {
            return getClientStats(user);
        }

        return getDefaultStats();
    }

    private Map<String, Object> getSuperAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // System-wide high-level stats only (no task details from other orgs)
        stats.put("totalOrganizations", organizationRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProjects", projectRepository.count());
        stats.put("activeOrganizations", organizationRepository.findByIsActiveTrue().size());
        stats.put("systemHealth", "99.8%");
        stats.put("role", "SUPER_ADMIN");
        
        return stats;
    }

    private Map<String, Object> getOrgAdminStats(User user) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get organizations where user is the org admin
        List<org.flow.flowbackend.model.Organization> adminOrganizations = 
            organizationRepository.findByOrgAdmin(user);
        
        // Also get organizations where user is a member (fallback)
        List<org.flow.flowbackend.model.OrganizationMember> memberships = 
            organizationMemberRepository.findByUser(user);
        
        // Combine both sources
        Set<Long> processedOrgIds = new HashSet<>();
        long totalProjects = 0;
        long totalMembers = 0;
        long totalTasks = 0;
        long completedTasks = 0;
        
        // Process organizations where user is the admin
        for (var org : adminOrganizations) {
            if (processedOrgIds.contains(org.getId())) continue;
            processedOrgIds.add(org.getId());
            
            List<org.flow.flowbackend.model.Project> projects = projectRepository.findByOrganization(org);
            totalProjects += projects.size();
            totalMembers += organizationMemberRepository.findByOrganization(org).size();
            
            for (var project : projects) {
                List<org.flow.flowbackend.model.Task> tasks = taskRepository.findByProject(project);
                totalTasks += tasks.size();
                completedTasks += tasks.stream().filter(this::isCompleted).count();
            }
        }
        
        // Also process organizations from memberships (if not already processed)
        for (var membership : memberships) {
            var org = membership.getOrganization();
            if (processedOrgIds.contains(org.getId())) continue;
            processedOrgIds.add(org.getId());
            
            List<org.flow.flowbackend.model.Project> projects = projectRepository.findByOrganization(org);
            totalProjects += projects.size();
            totalMembers += organizationMemberRepository.findByOrganization(org).size();
            
            for (var project : projects) {
                List<org.flow.flowbackend.model.Task> tasks = taskRepository.findByProject(project);
                totalTasks += tasks.size();
                completedTasks += tasks.stream().filter(this::isCompleted).count();
            }
        }
        
        stats.put("activeProjects", totalProjects);
        stats.put("teamMembers", totalMembers);
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("overdueTasks", getOverdueTaskCount(user));
        stats.put("role", "ORG_ADMIN");
        
        return stats;
    }

    private Map<String, Object> getProjectManagerStats(User user) {
        Map<String, Object> stats = new HashMap<>();
        
        // Projects managed by this user
        List<org.flow.flowbackend.model.Project> managedProjects = projectRepository.findByProjectManager(user);
        
        long totalTasks = 0;
        long completedTasks = 0;
        long inProgressTasks = 0;
        Set<Long> teamMemberIds = new HashSet<>();
        
        for (var project : managedProjects) {
            List<org.flow.flowbackend.model.Task> tasks = taskRepository.findByProject(project);
            totalTasks += tasks.size();
            completedTasks += tasks.stream().filter(this::isCompleted).count();
            inProgressTasks += tasks.stream().filter(this::isInProgress).count();
            
            // Collect team members
            projectMemberRepository.findByProject(project).forEach(pm -> teamMemberIds.add(pm.getUser().getId()));
        }
        
        stats.put("activeProjects", managedProjects.stream().filter(p -> p.isActive()).count());
        stats.put("totalProjects", managedProjects.size());
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("inProgressTasks", inProgressTasks);
        stats.put("teamMembers", teamMemberIds.size());
        stats.put("overdueTasks", getOverdueTaskCountForPM(user));
        stats.put("role", "PROJECT_MANAGER");
        
        return stats;
    }

    private Map<String, Object> getTeamMemberStats(User user) {
        Map<String, Object> stats = new HashMap<>();
        
        // Tasks assigned to this user
        List<org.flow.flowbackend.model.Task> assignedTasks = taskRepository.findByAssignedTo(user);
        
        long totalAssigned = assignedTasks.size();
        long completed = assignedTasks.stream().filter(this::isCompleted).count();
        long inProgress = assignedTasks.stream().filter(this::isInProgress).count();
        long todo = assignedTasks.stream().filter(t -> "todo".equalsIgnoreCase(normalizeStatus(t.getStatus()))).count();
        
        // Count upcoming deadlines (next 7 days)
        LocalDate now = LocalDate.now();
        LocalDate weekLater = now.plusDays(7);
        long dueSoon = assignedTasks.stream()
            .filter(t -> t.getDueDate() != null)
            .filter(t -> {
                LocalDate dueLocalDate = t.getDueDate().toLocalDate();
                return !dueLocalDate.isBefore(now) && !dueLocalDate.isAfter(weekLater);
            })
            .count();
        
        // Projects user is member of
        List<org.flow.flowbackend.model.ProjectMember> memberships = projectMemberRepository.findByUser(user);
        
        stats.put("assignedTasks", totalAssigned);
        stats.put("completedTasks", completed);
        stats.put("inProgressTasks", inProgress);
        stats.put("todoTasks", todo);
        stats.put("dueSoon", dueSoon);
        stats.put("activeProjects", memberships.size());
        stats.put("role", "TEAM_MEMBER");
        
        return stats;
    }

    private Map<String, Object> getClientStats(User user) {
        Map<String, Object> stats = new HashMap<>();
        
        // Projects where user is a member (as client)
        List<org.flow.flowbackend.model.ProjectMember> memberships = projectMemberRepository.findByUser(user);
        
        long totalProjects = memberships.size();
        long totalTasks = 0;
        long completedTasks = 0;
        
        for (var membership : memberships) {
            var project = membership.getProject();
            List<org.flow.flowbackend.model.Task> tasks = taskRepository.findByProject(project);
            totalTasks += tasks.size();
            completedTasks += tasks.stream().filter(this::isCompleted).count();
        }
        
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;
        
        stats.put("activeProjects", totalProjects);
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("completionRate", String.format("%.1f%%", completionRate));
        stats.put("role", "CLIENT");
        
        return stats;
    }

    // ===== Helpers to normalize status semantics across frontend/backends =====
    private String normalizeStatus(String status) {
        if (status == null) return "";
        String s = status.trim().toLowerCase().replace("-", "_");
        if ("completed".equals(s)) return "done";
        if ("in_progress".equals(s) || "inprogress".equals(s)) return "in_progress";
        return s;
    }

    private String normalizePriority(String priority) {
        if (priority == null) return "";
        return priority.trim().toLowerCase();
    }

    private boolean isCompleted(Task task) {
        String s = normalizeStatus(task.getStatus());
        return "done".equals(s) || "completed".equals(s);
    }

    private boolean isInProgress(Task task) {
        String s = normalizeStatus(task.getStatus());
        return "in_progress".equals(s) || "review".equals(s) || "blocked".equals(s);
    }

    private boolean isUrgent(Task task) {
        return "urgent".equals(normalizePriority(task.getPriority()));
    }

    private boolean isOverdueByDate(Task task, LocalDate today) {
        return task.getDueDate() != null && task.getDueDate().toLocalDate().isBefore(today);
    }

    private Map<String, Object> getDefaultStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeProjects", 0);
        stats.put("totalTasks", 0);
        stats.put("completedTasks", 0);
        stats.put("role", "UNKNOWN");
        return stats;
    }

    private long getOverdueTaskCount(User user) {
        LocalDate today = LocalDate.now();
        return taskRepository.findAll().stream()
            .filter(t -> !isCompleted(t))
            .filter(t -> isOverdueByDate(t, today) || isUrgent(t))
            .count();
    }

    private long getOverdueTaskCountForPM(User user) {
        LocalDate today = LocalDate.now();
        List<org.flow.flowbackend.model.Project> managedProjects = projectRepository.findByProjectManager(user);
        
        return managedProjects.stream()
            .flatMap(p -> taskRepository.findByProject(p).stream())
            .filter(t -> !isCompleted(t))
            .filter(t -> isOverdueByDate(t, today) || isUrgent(t))
            .count();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentActivities(User user) {
        List<Map<String, Object>> activities = new ArrayList<>();
        List<String> roles = user.getRoles();
        
        // SUPER_ADMIN: Show org-level activity only (no task details from other orgs)
        if (roles != null && roles.contains("SUPER_ADMIN")) {
            // Show recent organizations created
            List<org.flow.flowbackend.model.Organization> recentOrgs = organizationRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(3)
                .collect(Collectors.toList());
            
            for (var org : recentOrgs) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "organization");
                activity.put("title", "Organization '" + org.getName() + "' created");
                activity.put("time", org.getCreatedAt().toString());
                activity.put("projectName", "-");
                activities.add(activity);
            }
            
            // Show recent projects from "Flow" organization only
            List<org.flow.flowbackend.model.Project> recentProjects = projectRepository.findAll().stream()
                .filter(p -> p.getOrganization() != null && "Flow".equalsIgnoreCase(p.getOrganization().getName()))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(3)
                .collect(Collectors.toList());
            
            for (var project : recentProjects) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "project");
                activity.put("title", "Project '" + project.getName() + "' added");
                activity.put("time", project.getCreatedAt().toString());
                String orgName = project.getOrganization() != null ? project.getOrganization().getName() : "Unknown";
                activity.put("projectName", orgName);
                activities.add(activity);
            }
            
            return activities;
        }
        
        // Other roles: Show recent tasks
        List<org.flow.flowbackend.model.Task> recentTasks = taskRepository.findAll().stream()
            .sorted((a, b) -> {
                if (a.getUpdatedAt() == null) return 1;
                if (b.getUpdatedAt() == null) return -1;
                return b.getUpdatedAt().compareTo(a.getUpdatedAt());
            })
            .limit(5)
            .collect(Collectors.toList());
        
        for (var task : recentTasks) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "task");
            activity.put("title", "Task '" + task.getTitle() + "' updated");
            activity.put("time", task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : task.getCreatedAt().toString());
            activity.put("projectName", task.getProject() != null ? task.getProject().getName() : "Unknown");
            activities.add(activity);
        }
        
        return activities;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUpcomingDeadlines(User user) {
        LocalDate now = LocalDate.now();
        LocalDate weekLater = now.plusDays(7);
        
        List<org.flow.flowbackend.model.Task> tasks;
        
        // Get tasks based on role
        // Get tasks based on role
        if (user.getRoles().contains("SUPER_ADMIN")) {
            // SUPER_ADMIN only sees tasks from the "Flow" organization
            tasks = taskRepository.findAll().stream()
                .filter(t -> t.getProject() != null 
                    && t.getProject().getOrganization() != null 
                    && "Flow".equalsIgnoreCase(t.getProject().getOrganization().getName()))
                .collect(Collectors.toList());
        } else if (user.getRoles().contains("ORG_ADMIN")) {
             List<org.flow.flowbackend.model.Organization> orgs = organizationRepository.findByOrgAdmin(user);
             List<org.flow.flowbackend.model.OrganizationMember> memberships = organizationMemberRepository.findByUser(user);
             
             Set<org.flow.flowbackend.model.Organization> uniqueOrgs = new HashSet<>(orgs);
             memberships.forEach(m -> uniqueOrgs.add(m.getOrganization()));

             tasks = uniqueOrgs.stream()
                .flatMap(org -> projectRepository.findByOrganization(org).stream())
                .flatMap(proj -> taskRepository.findByProject(proj).stream())
                .collect(Collectors.toList());
        } else if (user.getRoles().contains("PROJECT_MANAGER")) {
            tasks = projectRepository.findByProjectManager(user).stream()
                .flatMap(p -> taskRepository.findByProject(p).stream())
                .collect(Collectors.toList());
        } else {
            tasks = taskRepository.findByAssignedTo(user);
        }
        
        return tasks.stream()
            .filter(t -> t.getDueDate() != null)
            .filter(t -> {
                LocalDate dueLocalDate = t.getDueDate().toLocalDate();
                return !dueLocalDate.isBefore(now) && !dueLocalDate.isAfter(weekLater);
            })
            .filter(t -> !isCompleted(t))
            .sorted(Comparator.comparing(org.flow.flowbackend.model.Task::getDueDate))
            .limit(5)
            .map(t -> {
                Map<String, Object> deadline = new HashMap<>();
                deadline.put("task", t.getTitle());
                deadline.put("project", t.getProject() != null ? t.getProject().getName() : "Unknown");
                deadline.put("date", t.getDueDate().toString());
                deadline.put("taskId", t.getId());
                return deadline;
            })
            .collect(Collectors.toList());
    }
}
