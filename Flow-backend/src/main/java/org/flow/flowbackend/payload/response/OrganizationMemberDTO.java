package org.flow.flowbackend.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrganizationMemberDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String organizationRole;
    private String profileImageUrl;
    private List<String> roles;
    
    @JsonProperty("isActive")
    private boolean isActive;
}
