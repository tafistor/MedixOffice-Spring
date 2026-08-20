package com.medixoffice.backend.dto.appointment;

import com.medixoffice.backend.entity.AppointmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AppointmentCreateRequest(
        @NotNull Integer doctorId,
        @NotNull Integer patientId,
        @NotNull LocalDate date,
        @NotBlank String time,
        @NotBlank String visitDescription,
        BigDecimal amount,
        AppointmentStatus status
) {
}
