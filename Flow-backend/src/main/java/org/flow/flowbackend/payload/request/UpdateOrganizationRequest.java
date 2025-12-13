package org.flow.flowbackend.payload.request;

import lombok.Data;

@Data
public class UpdateOrganizationRequest {
    private String name;
    private String description;
    private Long orgAdminId;
    private Boolean isActive;
}
