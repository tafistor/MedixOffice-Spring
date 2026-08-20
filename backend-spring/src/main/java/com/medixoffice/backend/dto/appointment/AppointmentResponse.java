package com.medixoffice.backend.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Reuses DoctorResponse/PatientResponse for the nested Doctor/Patient - same shape Node's include produced, minus needing separate DTO classes. */
public record AppointmentResponse(
        Integer id,
        // See InvoiceResponse for why these flat FK fields are needed alongside
        // the nested Doctor/Patient objects: Sequelize always included both, and
        // several frontend views (Appointments.jsx, AddEditAppointment.jsx)
        // filter/compare on appointment.patientId / .doctorId directly.
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
