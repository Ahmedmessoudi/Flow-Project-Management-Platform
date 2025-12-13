package org.flow.flowbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrganizationRequest {
    @NotBlank(message = "Organization name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Organization admin is required")
    private Long orgAdminId;
}
