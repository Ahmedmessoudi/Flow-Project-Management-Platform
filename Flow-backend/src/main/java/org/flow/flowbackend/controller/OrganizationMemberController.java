package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.OrganizationMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations/{organizationId}/members")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizationMemberController {

    private final OrganizationMemberService organizationMemberService;

    @Autowired
    public OrganizationMemberController(OrganizationMemberService organizationMemberService) {
        this.organizationMemberService = organizationMemberService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<List<org.flow.flowbackend.payload.response.OrganizationMemberDTO>> getMembersByOrganization(
            @PathVariable Long organizationId,
            org.springframework.security.core.Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(organizationMemberService.getMemberDTOsByOrganizationIdForUser(organizationId, currentUser));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<List<User>> getMembersByOrganizationAndRole(
            @PathVariable Long organizationId,
            @PathVariable String role) {
        return ResponseEntity.ok(organizationMemberService.getMembersByOrganizationIdAndRole(organizationId, role));
    }

    @PostMapping("/{userId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<OrganizationMember> addMemberToOrganization(
            @PathVariable Long organizationId,
            @PathVariable Long userId,
            @RequestParam(defaultValue = "TEAM_MEMBER") String role) {
        return ResponseEntity.ok(organizationMemberService.addMemberToOrganization(organizationId, userId, role));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<MessageResponse> removeMemberFromOrganization(
            @PathVariable Long organizationId,
            @PathVariable Long userId) {
        organizationMemberService.removeMemberFromOrganization(organizationId, userId);
        return ResponseEntity.ok(new MessageResponse("Member removed from organization successfully"));
    }
}
