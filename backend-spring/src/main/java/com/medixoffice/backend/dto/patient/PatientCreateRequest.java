package com.medixoffice.backend.dto.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record PatientCreateRequest(
        @NotBlank(message = "Le prénom est requis") String firstName,
        @NotBlank(message = "Le nom est requis") String lastName,
        LocalDate dateOfBirth,
        String currentTreatments,
        String chronicDiseases,
        String allergies,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide") String phone,
        @NotBlank @Email(message = "Email invalide") String email,
        @NotBlank(message = "L'adresse est requise") String address
) {
}
