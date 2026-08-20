package com.medixoffice.backend.dto.doctor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record DoctorCompleteProfileRequest(
        @NotNull Integer userId,
        String specialization,
        String licenseNumber,
        @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide") String phone,
        @Email(message = "Email invalide") String email
) {
}
