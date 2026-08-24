package com.medixoffice.backend.dto.invoice;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.consultation.ConsultationResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceResponse(
        Integer id,
        Integer patientId,
        Integer consultationId,
        LocalDate date,
        BigDecimal amount,
        String service,
        InvoiceStatus status,
        String invoiceNumber,
        @JsonProperty("Patient") PatientResponse patient,
        ConsultationResponse consultation
) {
}
