package org.flow.flowbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateProjectRequest {
    @NotBlank
    private String name;

    private String description;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Double budget;
    
    private String currency;
    
    private Long projectManagerId;
    
    private List<Long> memberIds;
}
