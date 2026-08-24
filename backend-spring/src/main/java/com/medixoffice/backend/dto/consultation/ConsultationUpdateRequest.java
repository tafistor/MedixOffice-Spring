package com.medixoffice.backend.dto.consultation;

import com.fasterxml.jackson.databind.JsonNode;
import com.medixoffice.backend.entity.ConsultationStatus;
import com.medixoffice.backend.entity.ConsultationType;

import java.time.LocalDate;
import java.time.LocalTime;

public record ConsultationUpdateRequest(
        LocalDate date,
        LocalTime time,
        ConsultationType type,
        ConsultationStatus status,
        String notes,
        JsonNode vitals
) {
}
