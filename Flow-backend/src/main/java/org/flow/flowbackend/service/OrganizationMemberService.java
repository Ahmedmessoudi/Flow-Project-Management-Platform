package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.repository.OrganizationMemberRepository;
import org.flow.flowbackend.repository.OrganizationRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrganizationMemberService {

    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final org.flow.flowbackend.repository.ProjectRepository projectRepository;
    private final org.flow.flowbackend.repository.ProjectMemberRepository projectMemberRepository;
    private final SystemSettingsService systemSettingsService;

    @Autowired
    public OrganizationMemberService(
            OrganizationMemberRepository organizationMemberRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            org.flow.flowbackend.repository.ProjectRepository projectRepository,
            org.flow.flowbackend.repository.ProjectMemberRepository projectMemberRepository,
            SystemSettingsService systemSettingsService) {
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.systemSettingsService = systemSettingsService;
    }

    /**
     * Get all members of an organization from organization_members table.
     */
    public List<User> getMembersByOrganizationId(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId).orElse(null);
        if (organization == null) {
            return List.of();
        }
        return organizationMemberRepository.findByOrganization(organization)
                .stream()
                .map(OrganizationMember::getUser)
                .collect(Collectors.toList());
    }

    /**
     * Get all members of an organization as DTOs with role info.
     */
    public List<org.flow.flowbackend.payload.response.OrganizationMemberDTO> getMemberDTOsByOrganizationId(Long organizationId) {
        return getMemberDTOsByOrganizationIdForUser(organizationId, null);
    }

    /**
     * Get members of an organization, filtered by permissions of the current user.
     * If user is PROJECT_MANAGER, only return members associated with their projects.
     */
    public List<org.flow.flowbackend.payload.response.OrganizationMemberDTO> getMemberDTOsByOrganizationIdForUser(Long organizationId, User currentUser) {
        Organization organization = organizationRepository.findById(organizationId).orElse(null);
        if (organization == null) {
            return List.of();
        }

        List<OrganizationMember> members;

        // Permission check: if PM, filter members
        if (currentUser != null && currentUser.getRoles() != null && 
            currentUser.getRoles().contains("PROJECT_MANAGER") && 
            !currentUser.getRoles().contains("SUPER_ADMIN") && 
            !currentUser.getRoles().contains("ORG_ADMIN")) {
            
            // 1. Projects managed by this user in this org
            List<org.flow.flowbackend.model.Project> managedProjects = projectRepository.findByProjectManager(currentUser).stream()
                    .filter(p -> p.getOrganization().getId().equals(organizationId))
                    .collect(Collectors.toList());
            
            // 2. Projects where user is a member in this org
            List<org.flow.flowbackend.model.Project> memberProjects = projectMemberRepository.findByUser(currentUser).stream()
                    .map(org.flow.flowbackend.model.ProjectMember::getProject)
                    .filter(p -> p.getOrganization().getId().equals(organizationId))
                    .collect(Collectors.toList());
            
            java.util.Set<Long> visibleUserIds = new java.util.HashSet<>();
            visibleUserIds.add(currentUser.getId()); // Always see self

            // Collect IDs from managed projects
            for (org.flow.flowbackend.model.Project p : managedProjects) {
               projectMemberRepository.findByProject(p).forEach(pm -> visibleUserIds.add(pm.getUser().getId()));
               if (p.getProjectManager() != null) visibleUserIds.add(p.getProjectManager().getId());
            }

            // Collect IDs from member projects (usually just Project Manager and other members)
            for (org.flow.flowbackend.model.Project p : memberProjects) {
                 projectMemberRepository.findByProject(p).forEach(pm -> visibleUserIds.add(pm.getUser().getId()));
                 if (p.getProjectManager() != null) visibleUserIds.add(p.getProjectManager().getId());
            }

            // If no projects, return only self if member of org, or empty
            if (managedProjects.isEmpty() && memberProjects.isEmpty()) {
                 if (isMemberOfOrganization(organizationId, currentUser.getId())) {
                     // Check if they are part of the org mem list
                     members = organizationMemberRepository.findByOrganization(organization).stream()
                             .filter(m -> m.getUser().getId().equals(currentUser.getId()))
                             .collect(Collectors.toList());
                 } else {
                     return List.of();
                 }
            } else {
                // Fetch all org members and filter by visible IDs
                members = organizationMemberRepository.findByOrganization(organization).stream()
                        .filter(m -> visibleUserIds.contains(m.getUser().getId()))
                        .collect(Collectors.toList());
            }

        } else {
            // Admin or default: return all members
            members = organizationMemberRepository.findByOrganization(organization);
        }

        return members.stream()
                .map(member -> org.flow.flowbackend.payload.response.OrganizationMemberDTO.builder()
                        .id(member.getUser().getId())
                        .username(member.getUser().getUsername())
                        .email(member.getUser().getEmail())
                        .firstName(member.getUser().getFirstName())
                        .lastName(member.getUser().getLastName())
                        .organizationRole(member.getRole())
                        .profileImageUrl(member.getUser().getProfileImageUrl())
                        .roles(member.getUser().getRoles())
                        .isActive(member.getUser().isActive())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get organizations the user is a member of (via OrganizationMember or ProjectMember).
     */
    @Transactional(readOnly = true)
    public List<org.flow.flowbackend.payload.response.OrganizationDTO> getOrganizationDTOsByUser(User user) {
        java.util.Set<Long> processedOrgIds = new java.util.HashSet<>();
        java.util.List<org.flow.flowbackend.payload.response.OrganizationDTO> result = new java.util.ArrayList<>();
        
        // 1. Get organizations from OrganizationMember
        organizationMemberRepository.findByUser(user).stream()
                .map(OrganizationMember::getOrganization)
                .forEach(organizationEntity -> {
                    if (!processedOrgIds.contains(organizationEntity.getId())) {
                        processedOrgIds.add(organizationEntity.getId());
                        result.add(org.flow.flowbackend.payload.response.OrganizationDTO.builder()
                                .id(organizationEntity.getId())
                                .name(organizationEntity.getName())
                                .description(organizationEntity.getDescription())
                                .isActive(organizationEntity.isActive())
                                .build());
                    }
                });
        
        // 2. Get organizations from ProjectMember (for team members added to projects)
        projectMemberRepository.findByUser(user).stream()
                .map(pm -> pm.getProject().getOrganization())
                .filter(org -> org != null)
                .forEach(organizationEntity -> {
                    if (!processedOrgIds.contains(organizationEntity.getId())) {
                        processedOrgIds.add(organizationEntity.getId());
                        result.add(org.flow.flowbackend.payload.response.OrganizationDTO.builder()
                                .id(organizationEntity.getId())
                                .name(organizationEntity.getName())
                                .description(organizationEntity.getDescription())
                                .isActive(organizationEntity.isActive())
                                .build());
                    }
                });
        
        return result;
    }

    /**
     * Get members of an organization filtered by role.
     */
    public List<User> getMembersByOrganizationIdAndRole(Long organizationId, String role) {
        Organization organization = organizationRepository.findById(organizationId).orElse(null);
        if (organization == null) {
            return List.of();
        }
        return organizationMemberRepository.findByOrganizationAndRole(organization, role)
                .stream()
                .map(OrganizationMember::getUser)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrganizationMember addMemberToOrganization(Long organizationId, Long userId, String role) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if already exists in organization_members table
        if (organizationMemberRepository.existsByOrganizationAndUser(organization, user)) {
            // Update existing record
            OrganizationMember existing = organizationMemberRepository.findByOrganizationAndUser(organization, user)
                    .orElseThrow(() -> new RuntimeException("Member record not found"));
            existing.setRole(role);
            return organizationMemberRepository.save(existing);
        }

        // Check User Limit for Organization
        int maxUsers = systemSettingsService.getSystemLimits().getOrDefault("maxUsersPerOrganization", 50);
        if (organizationMemberRepository.countByOrganization(organization) >= maxUsers) {
            throw new RuntimeException("Maximum number of users (" + maxUsers + ") reached for this organization.");
        }

        // Create new organization member record
        OrganizationMember member = OrganizationMember.builder()
                .organization(organization)
                .user(user)
                .role(role)
                .joinedAt(OffsetDateTime.now())
                .build();

        return organizationMemberRepository.save(member);
    }

    @Transactional
    public void removeMemberFromOrganization(Long organizationId, Long userId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If membership exists, keep the record for FK integrity/audit, but mark role as DELETED
        organizationMemberRepository.findByOrganizationAndUser(organization, user)
                .ifPresent(member -> {
                    member.setRole("DELETED");
                    organizationMemberRepository.save(member);
                });

        // Anonymize and deactivate the user instead of deleting to avoid FK breakage
        String suffix = user.getId() != null ? user.getId().toString() : String.valueOf(System.currentTimeMillis());
        user.setFirstName("Deleted");
        user.setLastName("User");
        user.setUsername("deleted_user_" + suffix);
        user.setEmail("deleted_user_" + suffix + "@deleted.local");
        user.setPhone(null);
        user.setRoles(Collections.emptyList());
        user.setActive(false);
        user.setProfileImageUrl(null);
        userRepository.save(user);
    }

    public boolean isMemberOfOrganization(Long organizationId, Long userId) {
        Organization organization = organizationRepository.findById(organizationId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);
        
        if (organization == null || user == null) {
            return false;
        }
        
        // Check in organization_members table
        return organizationMemberRepository.existsByOrganizationAndUser(organization, user);
    }

    public Long getMemberCountByOrganization(Organization organization) {
        return organizationMemberRepository.countByOrganization(organization);
    }

    public Long getMemberCountByOrganizationId(Long organizationId) {
        return organizationMemberRepository.countByOrganizationId(organizationId);
    }
}
