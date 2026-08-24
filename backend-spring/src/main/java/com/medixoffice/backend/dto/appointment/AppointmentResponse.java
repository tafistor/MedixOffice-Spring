package com.medixoffice.backend.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;


public record AppointmentResponse(
        Integer id,

        Integer patientId,
        Integer doctorId,
        LocalDate date,
        String time,
        String visitDescription,
        BigDecimal amount,
        AppointmentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        @JsonProperty("Doctor") DoctorResponse doctor,
        @JsonProperty("Patient") PatientResponse patient
) {
}
