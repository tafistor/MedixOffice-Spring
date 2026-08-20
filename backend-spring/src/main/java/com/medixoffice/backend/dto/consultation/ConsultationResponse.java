package com.medixoffice.backend.dto.consultation;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.ConsultationStatus;
import com.medixoffice.backend.entity.ConsultationType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ConsultationResponse(
        Integer id,
        // See InvoiceResponse for why these flat FK fields are needed: Consultations.jsx
        // filters by consultation.patientId / .doctorId directly.
        Integer patientId,
        Integer doctorId,
        LocalDate date,
        LocalTime time,
        ConsultationType type,
        ConsultationStatus status,
        String notes,
        String vitals,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        @JsonProperty("Doctor") DoctorResponse doctor,
        @JsonProperty("Patient") PatientResponse patient
) {
}
