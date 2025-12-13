package org.flow.flowbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({"orgAdmin", "createdBy", "projects", "hibernateLazyInitializer", "handler"})
    private Organization organization;

    @Column(nullable = false)
    private String name;

    private String description;
    private LocalDate startDate;
    private LocalDate endDate;

    @JsonProperty("isActive")
    @Column(nullable = false)
    private boolean isActive = true;

    private Double budget;
    private String currency = "USD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({"organization", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_manager_id")
    @JsonIgnoreProperties({"organization", "passwordHash", "hibernateLazyInitializer", "handler"})
    private User projectManager;

    @Column(nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    private OffsetDateTime updatedAt;

    @Column(columnDefinition = "json")
    private String settings = "{}";

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Task> tasks = new ArrayList<>();
    
    // Expose organizationId for frontend
    public Long getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }
}