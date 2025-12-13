package org.flow.flowbackend.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {
    private String title;
    private String description;
    private String status; // todo, in_progress, review, done
    private String priority; // low, medium, high, urgent
    private OffsetDateTime dueDate;
    private Double estimatedHours;
    private Double actualHours;
    private Long assignedToId;
    private Integer orderIndex;
}
