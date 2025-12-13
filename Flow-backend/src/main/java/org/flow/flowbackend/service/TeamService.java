package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.repository.ProjectRepository;
import org.flow.flowbackend.payload.request.CreateTeamMemberRequest;
import org.flow.flowbackend.payload.response.OrganizationDTO;
import org.flow.flowbackend.repository.OrganizationMemberRepository;
import org.flow.flowbackend.repository.OrganizationRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TeamService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationService organizationService;
    private final PasswordEncoder passwordEncoder;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    @Autowired
    public TeamService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            OrganizationService organizationService,
            PasswordEncoder passwordEncoder,
            ProjectRepository projectRepository,
            ProjectService projectService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationService = organizationService;
        this.passwordEncoder = passwordEncoder;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
    }

    /**
     * Get the organization for a user based on their role and organization assignment
     */
    private Organization getOrganizationForUser(User user) {
        // For SUPER_ADMIN, return first organization
        if (user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN")) {
            List<Organization> orgs = organizationRepository.findAll();
            return orgs.isEmpty() ? null : orgs.get(0);
        }

        // For ORG_ADMIN, check if they are admin of any org
        if (user.getRoles() != null && user.getRoles().contains("ORG_ADMIN")) {
            List<Organization> orgs = organizationRepository.findByOrgAdmin(user);
            return orgs.isEmpty() ? null : orgs.get(0);
        }

        // For other users, check organization_members table
        List<OrganizationMember> memberships = organizationMemberRepository.findByUser(user);
        if (!memberships.isEmpty()) {
            return memberships.get(0).getOrganization();
        }

        return null;
    }

    @Transactional
    public User createAndAddMemberToOrganization(Long organizationId, CreateTeamMemberRequest request, User currentUser) {
        // Validate organization exists
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Check if current user is authorized
        if (!isAuthorizedForOrganization(currentUser, organization)) {
            throw new RuntimeException("You are not authorized to add members to this organization");
        }

        // Check if email or username already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already in use");
        }

        // Create the user with the specified role
        List<String> roles = new ArrayList<>();
        roles.add(request.getRole());

        User newUser = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .phone(request.getPhone())
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);

        // Add to organization_members table for the relationship
        OrganizationMember member = OrganizationMember.builder()
                .organization(organization)
                .user(savedUser)
                .role(request.getRole())
                .joinedAt(OffsetDateTime.now())
                .build();

        organizationMemberRepository.save(member);

        // If the new user is a client and a projectId is provided, attach them to that project
        if ("CLIENT".equalsIgnoreCase(request.getRole()) && request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            // Validate project belongs to the same organization
            if (project.getOrganization() == null || !project.getOrganization().getId().equals(organizationId)) {
                throw new RuntimeException("Selected project does not belong to this organization");
            }

            // Add as project member with CLIENT role (sends notifications/email via ProjectService)
            projectService.addMember(project.getId(), savedUser.getId(), "CLIENT");
        }

        return savedUser;
    }

    public OrganizationDTO getOrganizationForOrgAdmin(User currentUser) {
        Organization org = getOrganizationForUser(currentUser);
        if (org != null) {
            return organizationService.getOrganizationById(org.getId()).orElse(null);
        }
        throw new RuntimeException("No organization found for this user");
    }

    public List<User> getMembersForCurrentUser(User currentUser) {
        Organization organization = getOrganizationForUser(currentUser);
        if (organization == null) {
            return new ArrayList<>();
        }
        return organizationMemberRepository.findUsersByOrganizationId(organization.getId());
    }

    public Map<String, Object> getOrganizationStats(User currentUser) {
        Organization organization = getOrganizationForUser(currentUser);
        if (organization == null) {
            return getEmptyStats();
        }
        return getOrganizationStats(organization.getId());
    }

    public Map<String, Object> getOrganizationStats(Long organizationId) {
        Map<String, Object> stats = new HashMap<>();
        
        Organization organization = organizationRepository.findById(organizationId).orElse(null);

        if (organization == null) {
            return getEmptyStats();
        }

        List<User> members = organizationMemberRepository.findUsersByOrganizationId(organization.getId());
        
        int projectManagers = 0;
        int teamMembers = 0;
        int clients = 0;

        for (User member : members) {
            // Need to fetch organization-specific role, but for stats grouping we can approximation or fetch robustly.
            // However, the `organization_members` table has the specific role. 
            // The `findUsersByOrganizationId` returns Users, losing the role context from the join table.
            
            // Re-fetching full details user by user is inefficient. 
            // For stats, it is better to query the repository directly for counts.
            
            // But to minimize refactor risk, let's use the existing pattern but careful about roles.
            // The User.roles is global. We should ideally look at OrganizationMember role.
            
            // Let's rely on OrganizationMemberRepository for exact counts if possible, 
            // or iterate memberships.
            
            // Optimization: Fetch OrganizationMembers instead of Users
            List<OrganizationMember> membershipList = organizationMemberRepository.findByOrganization(organization);
            
            // Reset counts for this scoped list
            projectManagers = 0;
            teamMembers = 0;
            clients = 0;
            
            for (OrganizationMember om : membershipList) {
                String role = om.getRole();
                if ("PROJECT_MANAGER".equals(role)) {
                    projectManagers++;
                } else if ("CLIENT".equals(role)) {
                    clients++;
                } else {
                    teamMembers++;
                }
            }
            
            stats.put("totalMembers", membershipList.size());
            stats.put("projectManagers", projectManagers);
            stats.put("teamMembers", teamMembers);
            stats.put("clients", clients);
            stats.put("organizationId", organization.getId());
            stats.put("organizationName", organization.getName());
            
            return stats;
        }

        return getEmptyStats();
    }

    private Map<String, Object> getEmptyStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMembers", 0);
        stats.put("projectManagers", 0);
        stats.put("teamMembers", 0);
        stats.put("clients", 0);
        stats.put("organizationId", null);
        stats.put("organizationName", null);
        return stats;
    }

    private boolean isAuthorizedForOrganization(User user, Organization organization) {
        if (user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN")) {
            return true;
        }
        
        // Check if user is org admin of this organization
        if (organization.getOrgAdmin() != null && organization.getOrgAdmin().getId().equals(user.getId())) {
            return true;
        }

        // Check if user is a member of this organization
        return organizationMemberRepository.existsByOrganizationAndUser(organization, user);
    }
}
