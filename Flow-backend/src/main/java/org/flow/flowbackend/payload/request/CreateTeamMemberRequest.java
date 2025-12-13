package org.flow.flowbackend.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamMemberRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String username;
    private String password;
    private String role; // TEAM_MEMBER, PROJECT_MANAGER, CLIENT
    private String phone;
    private Long projectId; // optional, used when role is CLIENT to link to a project
}
