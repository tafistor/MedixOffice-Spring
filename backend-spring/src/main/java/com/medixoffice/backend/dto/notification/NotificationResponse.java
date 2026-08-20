package com.medixoffice.backend.dto.notification;

import com.medixoffice.backend.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(Integer id, String message, NotificationType type, boolean isRead, LocalDateTime createdAt) {
}
