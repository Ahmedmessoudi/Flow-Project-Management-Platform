package org.flow.flowbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notification_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "hibernateLazyInitializer", "handler"})
    private User user;

    @Column(nullable = false)
    private String type; // TASK_ASSIGNED, DEADLINE_APPROACHING, TASK_COMMENT, TASK_COMPLETED

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 1000)
    private String message;

    @Column(name = "related_entity_type")
    private String relatedEntityType; // TASK, PROJECT, etc.

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "is_read", nullable = false)
    @JsonProperty("isRead") // ensure JSON uses isRead to match frontend expectation
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
