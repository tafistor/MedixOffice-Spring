package com.medixoffice.backend.service;

import com.medixoffice.backend.entity.Notification;
import com.medixoffice.backend.entity.NotificationType;
import com.medixoffice.backend.repository.NotificationRepository;
import com.medixoffice.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Placeholder EmailService - logs what would be sent instead of using SMTP,
 * since the .env only has placeholder mail credentials right now. Swap this
 * out for a real spring-boot-starter-mail implementation once real
 * credentials are available; PatientService and friends only depend on the
 * EmailService interface, so nothing else needs to change.
 */
@Service
public class LoggingEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public LoggingEmailService(UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void sendWelcomeEmail(String email, String temporaryPassword, Integer userId) {
        log.info("[EMAIL STUB] Would send welcome email to {} (userId={})", email, userId);

        userRepository.findById(userId).ifPresent(user -> {
            Notification notification = new Notification(user, "Email de bienvenue envoyé à " + email, NotificationType.general);
            notificationRepository.save(notification);
        });
    }

    @Override
    public void sendAppointmentConfirmation(String patientEmail, Integer patientUserId, LocalDate date, String time) {
        log.info("[EMAIL STUB] Would send appointment confirmation to {} for {} at {}", patientEmail, date, time);

        userRepository.findById(patientUserId).ifPresent(user -> {
            String message = "Votre rendez-vous a été confirmé pour le " + date + " à " + time;
            notificationRepository.save(new Notification(user, message, NotificationType.appointment));
        });
    }

    @Override
    public void sendResetCodeEmail(String email, String code, Integer userId) {
        log.info("[EMAIL STUB] Would send password reset code to {}", email);

        // Node used a 'security' notification type here, which isn't a valid value
        // for the live ENUM('appointment','invoice','general') column - using
        // 'general' instead of replicating that bug.
        userRepository.findById(userId).ifPresent(user ->
                notificationRepository.save(new Notification(user, "Reset code sent to " + email, NotificationType.general)));
    }
}
