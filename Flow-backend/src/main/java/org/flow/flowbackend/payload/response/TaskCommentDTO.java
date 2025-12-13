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
public class TaskCommentDTO {
    private Long id;
    private String content;
    private Long userId;
    private String userName;
    private String userEmail;
    private OffsetDateTime createdAt;
}
