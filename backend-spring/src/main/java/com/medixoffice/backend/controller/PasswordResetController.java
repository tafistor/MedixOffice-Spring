package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.passwordreset.RequestResetCodeRequest;
import com.medixoffice.backend.dto.passwordreset.RequestResetCodeResponse;
import com.medixoffice.backend.dto.passwordreset.ResetPasswordRequest;
import com.medixoffice.backend.dto.passwordreset.VerifyResetCodeRequest;
import com.medixoffice.backend.dto.passwordreset.VerifyResetCodeResponse;
import com.medixoffice.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/password-reset")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/request-code")
    public RequestResetCodeResponse requestResetCode(@Valid @RequestBody RequestResetCodeRequest request) {
        return passwordResetService.requestResetCode(request.email());
    }

    @PostMapping("/verify-code")
    public VerifyResetCodeResponse verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        return passwordResetService.verifyResetCode(request.email(), request.code());
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.email(), request.code(), request.newPassword());
        return new MessageResponse("Your password has been reset successfully.");
    }
}
