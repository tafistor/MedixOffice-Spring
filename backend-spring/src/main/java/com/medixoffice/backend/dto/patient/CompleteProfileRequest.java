package com.medixoffice.backend.dto.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record CompleteProfileRequest(
        @NotNull Integer userId,
        LocalDate dateOfBirth,
        String currentTreatments,
        String chronicDiseases,
        String allergies,
        @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide") String phone,
        @Email(message = "Email invalide") String email,
        String address
) {
}
