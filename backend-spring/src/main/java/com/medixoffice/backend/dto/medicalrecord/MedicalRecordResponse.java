package com.medixoffice.backend.dto.medicalrecord;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.entity.MedicalRecordStatus;
import com.medixoffice.backend.entity.RecordType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record MedicalRecordResponse(
        Integer id,
        Integer patientId,
        Integer doctorId,
        Integer consultationId,
        RecordType recordType,
        String diagnosis,
        String treatment,
        Object prescription,
        List<StoredFile> labResults,
        List<StoredFile> attachments,
        MedicalRecordStatus status,
        boolean isConfidential,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        @JsonProperty("Doctor") DoctorResponse doctor,
        @JsonProperty("Patient") PatientResponse patient,
        @JsonProperty("modifier") DoctorResponse modifier,
        @JsonProperty("Consultation") ConsultationSummary consultation
) {
    public record ConsultationSummary(LocalDate date, LocalTime time, String type) {
    }
}
