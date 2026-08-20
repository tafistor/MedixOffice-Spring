package com.medixoffice.backend.dto.appointment;

import com.medixoffice.backend.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AppointmentUpdateRequest(
        Integer doctorId,
        Integer patientId,
        LocalDate date,
        String time,
        String visitDescription,
        BigDecimal amount,
        AppointmentStatus status
) {
}
