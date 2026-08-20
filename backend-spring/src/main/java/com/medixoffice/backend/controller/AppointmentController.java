package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.CountResponse;
import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.appointment.AppointmentCreateRequest;
import com.medixoffice.backend.dto.appointment.AppointmentResponse;
import com.medixoffice.backend.dto.appointment.AppointmentUpdateRequest;
import com.medixoffice.backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('patient', 'secretary')")
    public ResponseEntity<AppointmentResponse> createAppointment(@Valid @RequestBody AppointmentCreateRequest request,
                                                                   @AuthenticationPrincipal Integer userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createAppointment(request, userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public List<AppointmentResponse> getAppointments() {
        return appointmentService.getAppointments();
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public CountResponse getAppointmentCountByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return new CountResponse(appointmentService.getAppointmentCountByDate(date));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public AppointmentResponse updateAppointment(@PathVariable Integer id, @Valid @RequestBody AppointmentUpdateRequest request) {
        return appointmentService.updateAppointment(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public MessageResponse cancelAppointment(@PathVariable Integer id) {
        appointmentService.cancelAppointment(id);
        return new MessageResponse("Rendez-vous supprimé avec succès");
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public List<AppointmentResponse> getDoctorAppointments(
            @PathVariable Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return appointmentService.getDoctorAppointments(doctorId, startDate, endDate);
    }

    @GetMapping("/patient/{patientId}/today")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public List<AppointmentResponse> getPatientAppointmentsToday(@PathVariable Integer patientId) {
        return appointmentService.getPatientAppointmentsToday(patientId);
    }
}
