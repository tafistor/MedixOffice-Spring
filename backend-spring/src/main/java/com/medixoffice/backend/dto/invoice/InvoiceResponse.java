package com.medixoffice.backend.dto.invoice;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.consultation.ConsultationResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One shape used for every endpoint (create/list/get/update) - consultation is populated whenever the invoice has one linked, not just on the detail endpoint. */
public record InvoiceResponse(
        Integer id,
        LocalDate date,
        BigDecimal amount,
        String service,
        InvoiceStatus status,
        String invoiceNumber,
        @JsonProperty("Patient") PatientResponse patient,
        ConsultationResponse consultation
) {
}
