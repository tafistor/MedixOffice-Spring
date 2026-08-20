package com.medixoffice.backend.dto.passwordreset;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Email(message = "Invalid email") String email,
        @NotBlank @Size(min = 8, max = 8, message = "Code must be 8 characters long") String code,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters long") String newPassword
) {
}
