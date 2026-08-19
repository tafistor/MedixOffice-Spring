package com.medixoffice.backend.dto.auth;

import com.medixoffice.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Bean Validation replaces the express-validator chains that Node wired up but never actually checked (validationResult was never called). */
public record RegisterRequest(
        @NotBlank(message = "Le prénom est requis") String firstName,
        @NotBlank(message = "Le nom est requis") String lastName,
        @NotBlank @Email(message = "Email invalide") String email,
        @NotBlank @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères") String password,
        @NotNull(message = "Le rôle doit être 'admin', 'doctor', 'secretary' ou 'patient'") Role role
) {
}
