package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.NotificationEvent;
import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.model.WebhookConfig;
import org.flow.flowbackend.service.NotificationService;
import org.flow.flowbackend.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final OrganizationService organizationService;

    @Autowired
    public NotificationController(NotificationService notificationService,
                                   OrganizationService organizationService) {
        this.notificationService = notificationService;
        this.organizationService = organizationService;
    }

    /**
     * Get all notifications for the current user.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationEvent>> getNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<NotificationEvent> notifications = notificationService.getNotificationsForUser(user);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for the current user.
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationEvent>> getUnreadNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<NotificationEvent> notifications = notificationService.getUnreadNotificationsForUser(user);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark a notification as read.
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read for the current user.
     */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }

    // ===================== Webhook Config Endpoints =====================

    /**
     * Get webhook config for an organization.
     */
    @GetMapping("/webhook-config/{organizationId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN')")
    public ResponseEntity<WebhookConfig> getWebhookConfig(@PathVariable Long organizationId) {
        Organization organization = organizationService.getOrganizationEntityById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        return notificationService.getWebhookConfig(organization)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Save webhook config for an organization.
     */
    @PostMapping("/webhook-config")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN')")
    public ResponseEntity<WebhookConfig> saveWebhookConfig(@RequestBody WebhookConfigRequest request) {
        Organization organization = organizationService.getOrganizationEntityById(request.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        WebhookConfig config = notificationService.getWebhookConfig(organization)
                .orElse(WebhookConfig.builder()
                        .organization(organization)
                        .createdAt(java.time.OffsetDateTime.now())
                        .build());

        config.setWebhookUrl(request.getWebhookUrl());
        config.setSecretKey(request.getSecretKey());
        config.setActive(request.isActive());
        config.setEventTypes(request.getEventTypes());
        config.setTargetRoles(request.getTargetRoles());

        WebhookConfig saved = notificationService.saveWebhookConfig(config);
        return ResponseEntity.ok(saved);
    }

    // ===================== Request DTOs =====================

    @lombok.Data
    public static class WebhookConfigRequest {
        private Long organizationId;
        private String webhookUrl;
        private String secretKey;
        private boolean active;
        private List<String> eventTypes;
        private List<String> targetRoles;
    }
}
