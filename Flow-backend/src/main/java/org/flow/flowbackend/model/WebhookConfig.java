package org.flow.flowbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "webhook_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({"orgAdmin", "createdBy", "projects", "hibernateLazyInitializer", "handler"})
    private Organization organization;

    @Column(name = "webhook_url", nullable = false)
    private String webhookUrl;

    @Column(name = "secret_key")
    private String secretKey; // Optional HMAC signing key

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Convert(converter = StringListConverter.class)
    @Column(name = "event_types")
    private List<String> eventTypes; // TASK_ASSIGNED, DEADLINE_APPROACHING, etc.

    @Convert(converter = StringListConverter.class)
    @Column(name = "target_roles")
    private List<String> targetRoles; // PROJECT_MANAGER, TEAM_MEMBER, etc.

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
