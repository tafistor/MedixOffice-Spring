package com.medixoffice.backend.service;

public interface EmailService {

    void sendWelcomeEmail(String email, String temporaryPassword, Integer userId);
}
