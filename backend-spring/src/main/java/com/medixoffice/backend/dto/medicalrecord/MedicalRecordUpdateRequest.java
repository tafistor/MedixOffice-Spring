package com.medixoffice.backend.dto.medicalrecord;

import com.medixoffice.backend.entity.MedicalRecordStatus;
import com.medixoffice.backend.entity.RecordType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * existingLabResults/existingAttachments are JSON-encoded StoredFile[] - the
 * subset of the record's current files the client wants to KEEP (already
 * reflecting any removals the user made). Without this, an update can only
 * either leave files alone or wipe-and-replace them wholesale with whatever
 * was just uploaded, since there'd be no way to tell "delete this one" apart
 * from "no new files this time."
 */
public record MedicalRecordUpdateRequest(
        RecordType recordType,
        String diagnosis,
        String treatment,
        String prescription,
        MedicalRecordStatus status,
        Boolean isConfidential,
        Integer doctorId,
        List<MultipartFile> labResults,
        List<MultipartFile> attachments,
        String existingLabResults,
        String existingAttachments
) {
}
