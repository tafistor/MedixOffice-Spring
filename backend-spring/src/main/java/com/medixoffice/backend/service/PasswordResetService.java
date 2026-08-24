package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.passwordreset.RequestResetCodeResponse;
import com.medixoffice.backend.dto.passwordreset.VerifyResetCodeResponse;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResetCodeExpiredException;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.exception.VerifyCodeFailedException;
import com.medixoffice.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class PasswordResetService {

    private static final int CODE_LENGTH = 8;
    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final Duration CODE_TTL = Duration.ofMinutes(3);
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(3);
    private static final int MAX_ATTEMPTS = 3;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PasswordResetService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public RequestResetCodeResponse requestResetCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));

        String code = generateCode();
        user.setResetCode(code);
        user.setResetCodeExpires(LocalDateTime.now().plus(CODE_TTL));
        user.setResetAttempts(0);
        user.setResetBlockedUntil(null);

        emailService.sendResetCodeEmail(email, code, user.getId());

        return new RequestResetCodeResponse("Reset code sent by email", (int) CODE_TTL.getSeconds());
    }

    @Transactional(noRollbackFor = {VerifyCodeFailedException.class, ResetCodeExpiredException.class})
    public VerifyResetCodeResponse verifyResetCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .filter(u -> u.getResetCode() != null)
                .orElseThrow(() -> new ResourceNotFoundException("No reset code found"));

        if (user.getResetBlockedUntil() != null && user.getResetBlockedUntil().isAfter(LocalDateTime.now())) {
            throw new VerifyCodeFailedException("Too many attempts. Please wait before trying again.",
                    HttpStatus.TOO_MANY_REQUESTS, null, null);
        }

        if (user.getResetCodeExpires() == null || user.getResetCodeExpires().isBefore(LocalDateTime.now())) {
            clearResetState(user);
            throw new ResetCodeExpiredException("This code has expired. Please request a new code.");
        }

        if (!user.getResetCode().equalsIgnoreCase(code)) {
            int newAttempts = user.getResetAttempts() + 1;
            if (newAttempts >= MAX_ATTEMPTS) {
                user.setResetAttempts(newAttempts);
                user.setResetBlockedUntil(LocalDateTime.now().plus(BLOCK_DURATION));
                throw new VerifyCodeFailedException("Too many attempts. Please request a new code.",
                        HttpStatus.TOO_MANY_REQUESTS, null, true);
            }
            user.setResetAttempts(newAttempts);
            throw new VerifyCodeFailedException("Incorrect code. Please check and try again.",
                    HttpStatus.BAD_REQUEST, MAX_ATTEMPTS - newAttempts, null);
        }

        user.setResetAttempts(0);
        user.setResetBlockedUntil(null);

        return new VerifyResetCodeResponse("Code verified successfully", true);
    }

    @Transactional(noRollbackFor = ResetCodeExpiredException.class)
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .filter(u -> u.getResetCode() != null && u.getResetCode().equalsIgnoreCase(code))
                .orElseThrow(() -> new ResourceNotFoundException("Invalid reset code"));

        if (user.getResetCodeExpires() == null || user.getResetCodeExpires().isBefore(LocalDateTime.now())) {
            clearResetState(user);
            throw new ResetCodeExpiredException("This code has expired. Please request a new code.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        clearResetState(user);
    }

    private void clearResetState(User user) {
        user.setResetCode(null);
        user.setResetCodeExpires(null);
        user.setResetAttempts(0);
        user.setResetBlockedUntil(null);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt((int) (Math.random() * CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
