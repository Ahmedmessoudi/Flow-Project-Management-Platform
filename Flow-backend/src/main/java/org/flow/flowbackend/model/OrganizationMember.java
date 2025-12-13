package org.flow.flowbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "organization_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    private String role = "TEAM_MEMBER";

    @Column(nullable = false)
    private OffsetDateTime joinedAt = OffsetDateTime.now();
}
