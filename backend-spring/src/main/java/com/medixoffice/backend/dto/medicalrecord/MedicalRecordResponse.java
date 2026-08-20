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

/** labResults/attachments are returned as real JSON arrays (parsed back from the entity's stored string), not double-encoded strings. */
public record MedicalRecordResponse(
        Integer id,
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
