package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateOrganizationRequest;
import org.flow.flowbackend.payload.request.UpdateOrganizationRequest;
import org.flow.flowbackend.payload.response.OrganizationDTO;
import org.flow.flowbackend.repository.OrganizationRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationMemberService organizationMemberService;

    @Autowired
    public OrganizationService(OrganizationRepository organizationRepository, UserRepository userRepository, OrganizationMemberService organizationMemberService) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.organizationMemberService = organizationMemberService;
    }

    @Transactional
    public OrganizationDTO createOrganization(CreateOrganizationRequest request, User currentUser) {
        // Validate org admin exists and has ORG_ADMIN role
        User orgAdmin = userRepository.findById(request.getOrgAdminId())
                .orElseThrow(() -> new RuntimeException("Organization admin not found with id: " + request.getOrgAdminId()));
        
        if (orgAdmin.getRoles() == null || !orgAdmin.getRoles().contains("ORG_ADMIN")) {
            throw new RuntimeException("Selected user must have ORG_ADMIN role");
        }

        Organization organization = Organization.builder()
                .name(request.getName())
                .description(request.getDescription())
                .orgAdmin(orgAdmin)
                .createdBy(currentUser)
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .build();

        Organization saved = organizationRepository.save(organization);
        return convertToDTO(saved);
    }

    public List<OrganizationDTO> getAllOrganizations() {
        return organizationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<OrganizationDTO> getOrganizationById(Long id) {
        return organizationRepository.findById(id)
                .map(this::convertToDTO);
    }

    public Optional<Organization> getOrganizationEntityById(Long id) {
        return organizationRepository.findById(id);
    }

    public List<OrganizationDTO> getOrganizationsByUser(User user) {
        // If SUPER_ADMIN, return only the "Flow" organization
        if (user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN")) {
            return organizationRepository.findAll().stream()
                    .filter(org -> "Flow".equalsIgnoreCase(org.getName()))
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        List<OrganizationDTO> result;

        // If ORG_ADMIN, return organizations they manage
        if (user.getRoles() != null && user.getRoles().contains("ORG_ADMIN")) {
            result = organizationRepository.findByOrgAdmin(user).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } else {
            // For PROJECT_MANAGER and TEAM_MEMBER, return organizations they are members of
            List<OrganizationDTO> memberOrgs = organizationMemberService.getOrganizationDTOsByUser(user);
            if (!memberOrgs.isEmpty()) {
                result = memberOrgs;
            } else {
                // Fallback: return organizations they created (legacy support)
                result = organizationRepository.findByCreatedBy(user).stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            }
        }

        // Strict Access Control: Filter out inactive organizations for non-SUPER_ADMIN
        return result.stream()
                .filter(org -> org.isActive())
                .collect(Collectors.toList());
    }

    public boolean hasActiveOrganizations(User user) {
        // SUPER_ADMIN always has access
        if (user.getRoles() != null && user.getRoles().contains("SUPER_ADMIN")) {
            return true;
        }

        List<OrganizationDTO> userOrgs = getOrganizationsByUser(user);
        return !userOrgs.isEmpty();
    }

    @Transactional
    public OrganizationDTO updateOrganization(Long id, UpdateOrganizationRequest request) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));

        if (request.getName() != null) {
            organization.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            organization.setDescription(request.getDescription());
        }
        
        if (request.getOrgAdminId() != null) {
            User orgAdmin = userRepository.findById(request.getOrgAdminId())
                    .orElseThrow(() -> new RuntimeException("Organization admin not found"));
            
            if (orgAdmin.getRoles() == null || !orgAdmin.getRoles().contains("ORG_ADMIN")) {
                throw new RuntimeException("Selected user must have ORG_ADMIN role");
            }
            
            organization.setOrgAdmin(orgAdmin);
        }
        
        if (request.getIsActive() != null) {
            organization.setActive(request.getIsActive());
        }

        organization.setUpdatedAt(OffsetDateTime.now());
        Organization updated = organizationRepository.save(organization);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteOrganization(Long id) {
        if (!organizationRepository.existsById(id)) {
            throw new RuntimeException("Organization not found with id: " + id);
        }
        organizationRepository.deleteById(id);
    }

    public List<org.flow.flowbackend.payload.response.OrganizationMemberDTO> getOrganizationMemberDTOs(Long organizationId) {
        return organizationMemberService.getMemberDTOsByOrganizationId(organizationId);
    }

    private OrganizationDTO convertToDTO(Organization org) {
        int projectCount = 0;
        try {
            projectCount = organizationRepository.countProjectsByOrganizationId(org.getId());
        } catch (Exception e) {
            projectCount = 0;
        }
        
        int memberCount = 0;
        try {
            // Use ID-based count for reliability
            Long count = organizationMemberService.getMemberCountByOrganizationId(org.getId());
            memberCount = count.intValue();
        } catch (Exception e) {
             // System.out.println("Error calculating member count: " + e.getMessage());
             memberCount = 0;
        }

        return OrganizationDTO.builder()
                .id(org.getId())
                .name(org.getName())
                .description(org.getDescription())
                .orgAdminId(org.getOrgAdmin() != null ? org.getOrgAdmin().getId() : null)
                .orgAdminName(org.getOrgAdmin() != null ? 
                        org.getOrgAdmin().getFirstName() + " " + org.getOrgAdmin().getLastName() : null)
                .orgAdminEmail(org.getOrgAdmin() != null ? org.getOrgAdmin().getEmail() : null)
                .projectCount(projectCount)
                .memberCount(memberCount)
                .isActive(org.isActive())
                .createdById(org.getCreatedBy().getId())
                .createdByName(org.getCreatedBy().getFirstName() + " " + org.getCreatedBy().getLastName())
                .createdByRoles(org.getCreatedBy().getRoles())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }
}