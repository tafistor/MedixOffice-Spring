package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.CountResponse;
import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.doctor.CreateDoctorResponse;
import com.medixoffice.backend.dto.doctor.DoctorCompleteProfileRequest;
import com.medixoffice.backend.dto.doctor.DoctorCreateRequest;
import com.medixoffice.backend.dto.doctor.DoctorResponse;
import com.medixoffice.backend.dto.doctor.DoctorUpdateRequest;
import com.medixoffice.backend.service.DoctorService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public ResponseEntity<CreateDoctorResponse> createDoctor(@Valid @RequestBody DoctorCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.createDoctor(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
    public List<DoctorResponse> getDoctors(@RequestParam(required = false) String specialties) {
        return doctorService.getDoctors(specialties);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public CountResponse getDoctorCount() {
        return new CountResponse(doctorService.getDoctorCount());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor')")
    public DoctorResponse updateDoctor(@PathVariable Integer id, @Valid @RequestBody DoctorUpdateRequest request) {
        return doctorService.updateDoctor(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public MessageResponse deleteDoctor(@PathVariable Integer id) {
        doctorService.deleteDoctor(id);
        return new MessageResponse("doctor deleted successfully");
    }

    @PostMapping("/completeProfile")
    @PreAuthorize("hasRole('doctor')")
    public DoctorResponse completeProfile(@Valid @RequestBody DoctorCompleteProfileRequest request) {
        return doctorService.completeProfile(request);
    }

    @GetMapping("/byUser/{userId}")
    public DoctorResponse getDoctorByUserId(@PathVariable Integer userId) {
        return doctorService.getDoctorByUserId(userId);
    }
}
