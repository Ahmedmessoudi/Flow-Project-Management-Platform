package org.flow.flowbackend.service;

import org.flow.flowbackend.model.*;
import org.flow.flowbackend.repository.NotificationEventRepository;
import org.flow.flowbackend.repository.WebhookConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationEventRepository notificationEventRepository;
    private final WebhookConfigRepository webhookConfigRepository;
    private final HttpClient httpClient;

    @Autowired
    public NotificationService(NotificationEventRepository notificationEventRepository,
                               WebhookConfigRepository webhookConfigRepository) {
        this.notificationEventRepository = notificationEventRepository;
        this.webhookConfigRepository = webhookConfigRepository;
        this.httpClient = HttpClient.newHttpClient();
    }

    // ===================== Notification Event Methods =====================

    @Transactional
    public NotificationEvent createNotification(User user, String type, String title, String message,
                                                  String relatedEntityType, Long relatedEntityId) {
        NotificationEvent event = NotificationEvent.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build();
        
        NotificationEvent saved = notificationEventRepository.save(event);
        
        // Trigger webhook asynchronously if configured
        triggerWebhookAsync(user, type, title, message, relatedEntityType, relatedEntityId);
        
        return saved;
    }

    public List<NotificationEvent> getNotificationsForUser(User user) {
        return notificationEventRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<NotificationEvent> getUnreadNotificationsForUser(User user) {
        return notificationEventRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationEventRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationEventRepository.findById(notificationId).ifPresent(event -> {
            event.setRead(true);
            notificationEventRepository.save(event);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<NotificationEvent> unread = notificationEventRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        for (NotificationEvent event : unread) {
            event.setRead(true);
            notificationEventRepository.save(event);
        }
    }

    // ===================== Webhook Config Methods =====================

    public Optional<WebhookConfig> getWebhookConfig(Organization organization) {
        return webhookConfigRepository.findByOrganization(organization);
    }

    @Transactional
    public WebhookConfig saveWebhookConfig(WebhookConfig config) {
        config.setUpdatedAt(OffsetDateTime.now());
        return webhookConfigRepository.save(config);
    }

    // ===================== Webhook Trigger Methods =====================

    @Async
    public void triggerWebhookAsync(User user, String eventType, String title, String message,
                                     String relatedEntityType, Long relatedEntityId) {
        // Get user's organization(s) and check for webhook config
        // For simplicity, we'll check if the user has any roles and find relevant webhooks
        // In a real scenario, you'd want to get the organization context from the event
        
        List<WebhookConfig> activeWebhooks = webhookConfigRepository.findByIsActiveTrue();
        
        for (WebhookConfig config : activeWebhooks) {
            // Check if this event type is subscribed
            if (config.getEventTypes() != null && !config.getEventTypes().contains(eventType)) {
                continue;
            }
            
            // Check if user's role is targeted
            if (config.getTargetRoles() != null && !config.getTargetRoles().isEmpty()) {
                boolean roleMatch = user.getRoles() != null && 
                    user.getRoles().stream().anyMatch(role -> config.getTargetRoles().contains(role));
                if (!roleMatch) {
                    continue;
                }
            }
            
            // Send webhook
            sendWebhook(config.getWebhookUrl(), eventType, title, message, 
                        user.getEmail(), relatedEntityType, relatedEntityId);
        }
    }

    private void sendWebhook(String webhookUrl, String eventType, String title, String message,
                             String userEmail, String relatedEntityType, Long relatedEntityId) {
        try {
            String jsonPayload = String.format(
                "{\"eventType\":\"%s\",\"title\":\"%s\",\"message\":\"%s\",\"userEmail\":\"%s\",\"relatedEntityType\":\"%s\",\"relatedEntityId\":%d,\"timestamp\":\"%s\"}",
                eventType, escapeJson(title), escapeJson(message), userEmail, 
                relatedEntityType != null ? relatedEntityType : "null",
                relatedEntityId != null ? relatedEntityId : 0,
                OffsetDateTime.now().toString()
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        System.out.println("Webhook sent to " + webhookUrl + " - Status: " + response.statusCode());
                    })
                    .exceptionally(ex -> {
                        System.err.println("Webhook failed for " + webhookUrl + ": " + ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            System.err.println("Error sending webhook: " + e.getMessage());
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    // ===================== Event Type Constants =====================

    public static final String EVENT_TASK_ASSIGNED = "TASK_ASSIGNED";
    public static final String EVENT_TASK_COMPLETED = "TASK_COMPLETED";
    public static final String EVENT_TASK_COMMENT = "TASK_COMMENT";
    public static final String EVENT_DEADLINE_APPROACHING = "DEADLINE_APPROACHING";
}
