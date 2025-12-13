package org.flow.flowbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private String priority = "medium"; // low, medium, high, urgent
    
    private OffsetDateTime dueDate;
    
    private Double estimatedHours;
    
    private Long assignedToId;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
}
