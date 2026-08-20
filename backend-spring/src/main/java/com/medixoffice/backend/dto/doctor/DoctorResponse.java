package com.medixoffice.backend.dto.doctor;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DoctorResponse(
        Integer id,
        Integer userId,
        String specialization,
        String licenseNumber,
        String phone,
        String email,
        @JsonProperty("User") UserSummary user
) {
    public record UserSummary(String firstName, String lastName, String email) {
    }
}
