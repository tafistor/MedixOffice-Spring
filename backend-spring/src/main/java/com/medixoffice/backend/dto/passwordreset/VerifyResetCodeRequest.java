package com.medixoffice.backend.dto.passwordreset;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyResetCodeRequest(
        @NotBlank @Email(message = "Invalid email") String email,
        @NotBlank @Size(min = 8, max = 8, message = "Code must be 8 characters long") String code
) {
}
