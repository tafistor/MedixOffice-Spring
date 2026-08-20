package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.notification.NotificationResponse;
import com.medixoffice.backend.entity.Notification;
import com.medixoffice.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Integer userId) {
        return notificationRepository.findUnreadByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(Integer id) {
        notificationRepository.markAsRead(id);
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getMessage(), notification.getType(),
                notification.isRead(), notification.getCreatedAt());
    }
}
