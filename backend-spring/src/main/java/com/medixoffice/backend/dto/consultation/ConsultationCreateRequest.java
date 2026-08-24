package com.medixoffice.backend.dto.consultation;

import com.fasterxml.jackson.databind.JsonNode;
import com.medixoffice.backend.entity.ConsultationType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/** vitals is a JsonNode, not a String: the frontend sends it as a nested {bloodPressure, temperature, heartRate} object, not a JSON-encoded string. */
public record ConsultationCreateRequest(
        @NotNull Integer patientId,
        @NotNull Integer doctorId,
        @NotNull LocalDate date,
        @NotNull LocalTime time,
        @NotNull ConsultationType type,
        String notes,
        JsonNode vitals
) {
}
