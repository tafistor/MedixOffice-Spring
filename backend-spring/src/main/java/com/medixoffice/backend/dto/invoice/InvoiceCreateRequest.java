package com.medixoffice.backend.dto.invoice;

import com.medixoffice.backend.entity.InvoiceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceCreateRequest(
        @NotNull Integer patientId,
        Integer consultationId,
        @NotNull LocalDate date,
        @NotNull BigDecimal amount,
        @NotBlank String service,
        InvoiceStatus status
) {
}
