package org.flow.flowbackend.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDTO {
    private Long id;
    private String name;
    private String description;
    
    // Org Admin info
    private Long orgAdminId;
    private String orgAdminName;
    private String orgAdminEmail;
    
    // Counts
    private int projectCount;
    private int memberCount;
    
    // Status - ensure correct JSON property name
    @JsonProperty("isActive")
    private boolean isActive;
    
    // Created by info
    private Long createdById;
    private String createdByName;
    private List<String> createdByRoles;
    
    // Timestamps
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
