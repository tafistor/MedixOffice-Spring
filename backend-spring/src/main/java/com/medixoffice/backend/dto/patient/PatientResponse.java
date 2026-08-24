package com.medixoffice.backend.dto.patient;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientResponse(
        Integer id,
        Integer userId,
        LocalDate dateOfBirth,
        String chronicDiseases,
        String currentTreatments,
        String allergies,
        String phone,
        String email,
        String address,
        Integer age,
        boolean isActive,
        LocalDateTime deletedAt,
        @JsonProperty("User") UserSummary user
) {
    public record UserSummary(String firstName, String lastName, String email) {
    }
}
