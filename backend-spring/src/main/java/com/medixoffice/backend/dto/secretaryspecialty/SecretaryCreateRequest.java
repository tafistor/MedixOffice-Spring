package com.medixoffice.backend.dto.secretaryspecialty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SecretaryCreateRequest(
        @NotBlank(message = "Le prénom est requis") String firstName,
        @NotBlank(message = "Le nom est requis") String lastName,
        @NotBlank @Email(message = "Email invalide") String email
) {
}
