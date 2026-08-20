package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordCreateRequest;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordResponse;
import com.medixoffice.backend.dto.medicalrecord.MedicalRecordUpdateRequest;
import com.medixoffice.backend.entity.MedicalRecordStatus;
import com.medixoffice.backend.entity.RecordType;
import com.medixoffice.backend.service.MedicalRecordService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('doctor')")
    public ResponseEntity<MedicalRecordResponse> createMedicalRecord(
            @RequestParam Integer patientId,
            @RequestParam Integer doctorId,
            @RequestParam Integer consultationId,
            @RequestParam RecordType recordType,
            @RequestParam(required = false) String diagnosis,
            @RequestParam(required = false) String treatment,
            @RequestParam(required = false) String prescription,
            @RequestParam(required = false) MedicalRecordStatus status,
            @RequestParam(required = false, defaultValue = "false") boolean isConfidential,
            @RequestParam(value = "labResults", required = false) List<MultipartFile> labResults,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        var request = new MedicalRecordCreateRequest(patientId, doctorId, consultationId, recordType, diagnosis,
                treatment, prescription, status, isConfidential, labResults, attachments);
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.createMedicalRecord(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public List<MedicalRecordResponse> getMedicalRecords() {
        return medicalRecordService.getMedicalRecords();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('doctor')")
    public MedicalRecordResponse updateMedicalRecord(
            @PathVariable Integer id,
            @RequestParam(required = false) RecordType recordType,
            @RequestParam(required = false) String diagnosis,
            @RequestParam(required = false) String treatment,
            @RequestParam(required = false) String prescription,
            @RequestParam(required = false) MedicalRecordStatus status,
            @RequestParam(required = false) Boolean isConfidential,
            @RequestParam(required = false) Integer doctorId,
            @RequestParam(value = "labResults", required = false) List<MultipartFile> labResults,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        var request = new MedicalRecordUpdateRequest(recordType, diagnosis, treatment, prescription, status,
                isConfidential, doctorId, labResults, attachments);
        return medicalRecordService.updateMedicalRecord(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor')")
    public MessageResponse deleteMedicalRecord(@PathVariable Integer id) {
        medicalRecordService.deleteMedicalRecord(id);
        return new MessageResponse("Medical record deleted successfully");
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'patient')")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Integer id) {
        byte[] pdf = medicalRecordService.generatePdf(id);
        String filename = "dossier_medical_" + id + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }

    @GetMapping("/{id}/download-complete")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'patient')")
    public ResponseEntity<byte[]> downloadCompleteFolder(@PathVariable Integer id) {
        byte[] zip = medicalRecordService.generateCompleteZip(id);
        String filename = "dossier_complet_" + id + ".zip";
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(zip);
    }
}
