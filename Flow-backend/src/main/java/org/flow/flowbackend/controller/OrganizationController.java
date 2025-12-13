package org.flow.flowbackend.controller;

import jakarta.validation.Valid;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateOrganizationRequest;
import org.flow.flowbackend.payload.request.UpdateOrganizationRequest;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.payload.response.OrganizationDTO;
import org.flow.flowbackend.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizationController {

    private final OrganizationService organizationService;

    @Autowired
    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            OrganizationDTO created = organizationService.createOrganization(request, currentUser);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<OrganizationDTO>> getOrganizationsByUser(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(organizationService.getOrganizationsByUser(currentUser));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<List<OrganizationDTO>> getAllOrganizations() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> getOrganizationById(@PathVariable Long id) {
        return organizationService.getOrganizationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> updateOrganization(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrganizationRequest request) {
        try {
            OrganizationDTO updated = organizationService.updateOrganization(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> deleteOrganization(@PathVariable Long id) {
        try {
            organizationService.deleteOrganization(id);
            return ResponseEntity.ok(new MessageResponse("Organization deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}