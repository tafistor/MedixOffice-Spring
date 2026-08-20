package com.medixoffice.backend.dto.doctor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DoctorCreateRequest(
        @NotBlank(message = "Le prénom est requis") String firstName,
        @NotBlank(message = "Le nom est requis") String lastName,
        @NotBlank String specialization,
        @NotBlank String licenseNumber,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide") String phone,
        @NotBlank @Email(message = "Email invalide") String email
) {
}
