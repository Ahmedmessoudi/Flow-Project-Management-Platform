package org.flow.flowbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class MeetingRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private OffsetDateTime scheduledAt;

    @NotNull
    private Long projectId;
}
