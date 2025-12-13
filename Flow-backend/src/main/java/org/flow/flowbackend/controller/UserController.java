package org.flow.flowbackend.controller;

import jakarta.validation.Valid;
import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.OrganizationMember;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.request.CreateUserRequest;
import org.flow.flowbackend.payload.request.UpdateUserRequest;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.repository.OrganizationMemberRepository;
import org.flow.flowbackend.repository.OrganizationRepository;
import org.flow.flowbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;

    // Define roles as static list since they are managed in frontend
    private static final List<Map<String, Object>> AVAILABLE_ROLES = Arrays.asList(
            createRole(1, "SUPER_ADMIN", "Full system access", 1),
            createRole(2, "ORG_ADMIN", "Organization administrator", 2),
            createRole(3, "PROJECT_MANAGER", "Manages projects", 3),
            createRole(4, "TEAM_MEMBER", "Team member", 4),
            createRole(5, "CLIENT", "External client", 5)
    );

    private static Map<String, Object> createRole(int id, String name, String description, int level) {
        Map<String, Object> role = new HashMap<>();
        role.put("id", id);
        role.put("name", name);
        role.put("description", description);
        role.put("level", level);
        return role;
    }

    @Autowired
    public UserController(UserService userService, 
                         OrganizationMemberRepository organizationMemberRepository,
                         OrganizationRepository organizationRepository) {
        this.userService = userService;
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationRepository = organizationRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (User user : users) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail());
            userMap.put("firstName", user.getFirstName());
            userMap.put("lastName", user.getLastName());
            userMap.put("phone", user.getPhone());
            userMap.put("profileImageUrl", user.getProfileImageUrl());
            userMap.put("isActive", user.isActive());
            userMap.put("createdAt", user.getCreatedAt());
            userMap.put("updatedAt", user.getUpdatedAt());
            userMap.put("roles", user.getRoles());
            
            // Collect all organizations for this user
            Set<Long> orgIds = new HashSet<>();
            List<Map<String, Object>> orgs = new ArrayList<>();
            
            // 1. Get organizations from organization_members table
            List<OrganizationMember> memberships = organizationMemberRepository.findByUser(user);
            for (OrganizationMember m : memberships) {
                if (!orgIds.contains(m.getOrganization().getId())) {
                    orgIds.add(m.getOrganization().getId());
                    Map<String, Object> org = new HashMap<>();
                    org.put("id", m.getOrganization().getId());
                    org.put("name", m.getOrganization().getName());
                    org.put("role", m.getRole());
                    orgs.add(org);
                }
            }
            
            // 2. Get organizations where user is the org_admin (for ORG_ADMIN users)
            if (user.getRoles() != null && user.getRoles().contains("ORG_ADMIN")) {
                List<Organization> adminOrgs = organizationRepository.findByOrgAdmin(user);
                for (Organization adminOrg : adminOrgs) {
                    if (!orgIds.contains(adminOrg.getId())) {
                        orgIds.add(adminOrg.getId());
                        Map<String, Object> org = new HashMap<>();
                        org.put("id", adminOrg.getId());
                        org.put("name", adminOrg.getName());
                        org.put("role", "ORG_ADMIN");
                        orgs.add(org);
                    }
                }
            }
            
            userMap.put("organizations", orgs);
            result.add(userMap);
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or authentication.principal.id == #id")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String roleName) {
        return ResponseEntity.ok(userService.getUsersByRole(roleName));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllRoles() {
        return ResponseEntity.ok(AVAILABLE_ROLES);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPasswordHash(request.getPassword()); // Will be encoded in service
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setPhone(request.getPhone());
            user.setActive(true);

            // Create user first
            User createdUser = userService.createUser(user);

            // Assign roles if provided
            if (request.getRoles() != null && !request.getRoles().isEmpty()) {
                createdUser = userService.assignRoles(createdUser.getId(), request.getRoles());
            }

            return ResponseEntity.ok(createdUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            User updates = new User();
            updates.setUsername(request.getUsername());
            updates.setEmail(request.getEmail());
            updates.setPasswordHash(request.getPassword()); // Will be encoded in service if not null
            updates.setFirstName(request.getFirstName());
            updates.setLastName(request.getLastName());
            updates.setPhone(request.getPhone());
            if (request.getIsActive() != null) {
                updates.setActive(request.getIsActive());
            }

            User updatedUser = userService.updateUser(id, updates);

            // Update roles if provided
            if (request.getRoles() != null) {
                updatedUser = userService.assignRoles(id, request.getRoles());
            }

            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new MessageResponse("User deactivated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String newPassword = request.get("newPassword");
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            User userDetails = (User) auth.getPrincipal();
            
            userService.changePassword(userDetails.getId(), newPassword);
            
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error changing password: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isActive = request.get("isActive");
            if (isActive == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("isActive field is required"));
            }
            
            User user = userService.getUserById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            User updates = new User();
            updates.setActive(isActive);
            
            User updatedUser = userService.updateUser(id, updates);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
