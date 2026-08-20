package com.medixoffice.backend.dto.passwordreset;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RequestResetCodeRequest(@NotBlank @Email(message = "Invalid email") String email) {
}
