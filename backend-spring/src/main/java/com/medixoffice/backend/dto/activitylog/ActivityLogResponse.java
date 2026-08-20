package com.medixoffice.backend.dto.activitylog;

import java.time.LocalDateTime;

public record ActivityLogResponse(Integer id, Integer userId, String userEmail, String role, String method,
                                   String path, LocalDateTime createdAt) {
}
