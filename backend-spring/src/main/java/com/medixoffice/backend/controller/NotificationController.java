package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.notification.NotificationResponse;
import com.medixoffice.backend.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@PreAuthorize("hasAnyRole('admin', 'secretary')")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}/unread")
    public List<NotificationResponse> getUnreadNotifications(@PathVariable Integer userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @PutMapping("/{id}/read")
    public MessageResponse markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return new MessageResponse("Notification marquée comme lue");
    }

    @PutMapping("/user/{userId}/read-all")
    public MessageResponse markAllAsRead(@PathVariable Integer userId) {
        notificationService.markAllAsRead(userId);
        return new MessageResponse("Toutes les notifications marquées comme lues");
    }
}
