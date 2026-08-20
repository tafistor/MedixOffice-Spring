package com.medixoffice.backend.dto.auth;

import com.medixoffice.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Bean Validation replaces the express-validator chains that Node wired up but
 * never actually checked (validationResult was never called) - Node's own
 * intended rule was just a 6-char minimum. Strengthened here to require a
 * letter and a digit too, since a bare 6-char minimum doesn't demonstrate
 * real password strength for the security section of the brief.
 */
public record RegisterRequest(
        @NotBlank(message = "Le prénom est requis") String firstName,
        @NotBlank(message = "Le nom est requis") String lastName,
        @NotBlank @Email(message = "Email invalide") String email,
        @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                message = "Le mot de passe doit contenir au moins 8 caractères, avec au moins une lettre et un chiffre")
        String password,
        @NotNull(message = "Le rôle doit être 'admin', 'doctor', 'secretary' ou 'patient'") Role role
) {
}
