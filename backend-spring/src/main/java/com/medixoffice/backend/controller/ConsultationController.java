package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.CountResponse;
import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.consultation.ConsultationCreateRequest;
import com.medixoffice.backend.dto.consultation.ConsultationResponse;
import com.medixoffice.backend.dto.consultation.ConsultationUpdateRequest;
import com.medixoffice.backend.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('doctor')")
    public ResponseEntity<ConsultationResponse> createConsultation(@Valid @RequestBody ConsultationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consultationService.createConsultation(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public List<ConsultationResponse> getConsultations() {
        return consultationService.getConsultations();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('admin', 'doctor')")
    public List<ConsultationResponse> getPatientConsultations(@PathVariable Integer patientId) {
        return consultationService.getPatientConsultations(patientId);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public CountResponse getConsultationCountByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return new CountResponse(consultationService.getConsultationCountByDate(date));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('doctor')")
    public ConsultationResponse updateConsultation(@PathVariable Integer id, @Valid @RequestBody ConsultationUpdateRequest request) {
        return consultationService.updateConsultation(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('doctor')")
    public MessageResponse deleteConsultation(@PathVariable Integer id) {
        consultationService.deleteConsultation(id);
        return new MessageResponse("Consultation deleted successfully");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public ConsultationResponse getConsultationById(@PathVariable Integer id) {
        return consultationService.getConsultationById(id);
    }
}
