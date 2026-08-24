package com.medixoffice.backend.dto.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record PatientUpdateRequest(
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String chronicDiseases,
        String currentTreatments,
        String allergies,
        @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide") String phone,
        @Email(message = "Email invalide") String email,
        String address
) {
}
