package com.medixoffice.backend.dto.medicalrecord;

import com.medixoffice.backend.entity.MedicalRecordStatus;
import com.medixoffice.backend.entity.RecordType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Assembled by the controller from multipart @RequestParams - not bound directly by Spring. */
public record MedicalRecordCreateRequest(
        Integer patientId,
        Integer doctorId,
        Integer consultationId,
        RecordType recordType,
        String diagnosis,
        String treatment,
        String prescription,
        MedicalRecordStatus status,
        boolean isConfidential,
        List<MultipartFile> labResults,
        List<MultipartFile> attachments
) {
}
