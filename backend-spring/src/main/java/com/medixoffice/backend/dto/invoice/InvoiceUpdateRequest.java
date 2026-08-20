package com.medixoffice.backend.dto.invoice;

import com.medixoffice.backend.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceUpdateRequest(
        Integer patientId,
        Integer consultationId,
        LocalDate date,
        BigDecimal amount,
        String service,
        InvoiceStatus status
) {
}
