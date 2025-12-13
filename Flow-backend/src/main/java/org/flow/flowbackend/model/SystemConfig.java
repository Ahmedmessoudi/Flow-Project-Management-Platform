package org.flow.flowbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "system_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfig {
    @Id
    @Column(name = "config_key", nullable = false)
    private String key;

    @Column(name = "config_value", length = 1000)
    private String value;

    @Column(name = "category")
    private String category;

    @Column(name = "description")
    private String description;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
