package org.flow.flowbackend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private OffsetDateTime dueDate;
    private Double estimatedHours;
    private Double actualHours;
    private Integer orderIndex;
    
    // Project info
    private Long projectId;
    private String projectName;
    
    // Assigned user info
    private Long assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    
    // Created by user info
    private Long createdById;
    private String createdByName;
    
    // Parent task info
    private Long parentTaskId;
    
    // Comment count
    private Long commentCount;
    
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
