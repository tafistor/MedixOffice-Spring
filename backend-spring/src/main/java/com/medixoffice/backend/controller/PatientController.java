package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.CountResponse;
import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.patient.CompleteProfileRequest;
import com.medixoffice.backend.dto.patient.CreatePatientResponse;
import com.medixoffice.backend.dto.patient.PatientCreateRequest;
import com.medixoffice.backend.dto.patient.PatientResponse;
import com.medixoffice.backend.dto.patient.PatientUpdateRequest;
import com.medixoffice.backend.service.PatientService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public CountResponse getPatientCount() {
        return new CountResponse(patientService.getPatientCount());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public ResponseEntity<CreatePatientResponse> createPatient(@Valid @RequestBody PatientCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.createPatient(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public List<PatientResponse> getPatients() {
        return patientService.getPatients();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public PatientResponse getPatient(@PathVariable Integer id) {
        return patientService.getPatient(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public PatientResponse updatePatient(@PathVariable Integer id, @Valid @RequestBody PatientUpdateRequest request) {
        return patientService.updatePatient(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public MessageResponse deletePatient(@PathVariable Integer id) {
        patientService.deletePatient(id);
        return new MessageResponse("Patient and associated user deactivated successfully");
    }

    @PostMapping("/completeProfile")
    @PreAuthorize("hasRole('patient')")
    public PatientResponse completeProfile(@Valid @RequestBody CompleteProfileRequest request) {
        return patientService.completeProfile(request);
    }

    @GetMapping("/byUser/{userId}")
    public PatientResponse getPatientByUserId(@PathVariable Integer userId) {
        return patientService.getPatientByUserId(userId);
    }
}
