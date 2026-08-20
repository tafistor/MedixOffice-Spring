package com.medixoffice.backend.service;

import java.time.LocalDate;

public interface EmailService {

    void sendWelcomeEmail(String email, String temporaryPassword, Integer userId);

    void sendAppointmentConfirmation(String patientEmail, Integer patientUserId, LocalDate date, String time);

    void sendResetCodeEmail(String email, String code, Integer userId);
}
