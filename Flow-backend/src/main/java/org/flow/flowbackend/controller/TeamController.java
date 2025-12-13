package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateTeamMemberRequest;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/team")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TeamController {

    private final TeamService teamService;

    @Autowired
    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/organizations/{organizationId}/members")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> createAndAddMember(
            @PathVariable Long organizationId,
            @RequestBody CreateTeamMemberRequest request,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            User newMember = teamService.createAndAddMemberToOrganization(organizationId, request, currentUser);
            return ResponseEntity.ok(newMember);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/my-organization")
    @PreAuthorize("hasAuthority('ORG_ADMIN') or hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> getMyOrganization(Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(teamService.getOrganizationForOrgAdmin(currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/my-organization/members")
    @PreAuthorize("hasAuthority('ORG_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> getMyOrganizationMembers(Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(teamService.getMembersForCurrentUser(currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/my-organization/stats")
    @PreAuthorize("hasAuthority('ORG_ADMIN') or hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> getMyOrganizationStats(Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            return ResponseEntity.ok(teamService.getOrganizationStats(currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    @GetMapping("/organizations/{organizationId}/stats")
    @PreAuthorize("hasAuthority('ORG_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> getOrganizationStats(@PathVariable Long organizationId, Authentication authentication) {
        try {
            // Optional: verify access to this org
            return ResponseEntity.ok(teamService.getOrganizationStats(organizationId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
