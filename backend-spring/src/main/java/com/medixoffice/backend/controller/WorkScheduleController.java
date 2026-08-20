package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.workschedule.CopyPreviousWeekRequest;
import com.medixoffice.backend.dto.workschedule.CreateScheduleRequest;
import com.medixoffice.backend.dto.workschedule.DoctorScheduleResponse;
import com.medixoffice.backend.dto.workschedule.UpdateScheduleRequest;
import com.medixoffice.backend.service.WorkScheduleService;
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
@RequestMapping("/work-schedules")
public class WorkScheduleController {

    private final WorkScheduleService workScheduleService;

    public WorkScheduleController(WorkScheduleService workScheduleService) {
        this.workScheduleService = workScheduleService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public List<DoctorScheduleResponse> getAllSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String specialties) {
        return workScheduleService.getAllSchedules(startDate, endDate, specialties);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public ResponseEntity<DoctorScheduleResponse> createSchedule(@Valid @RequestBody CreateScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workScheduleService.createSchedule(request));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary', 'patient')")
    public DoctorScheduleResponse getDoctorSchedule(
            @PathVariable Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return workScheduleService.getDoctorSchedule(doctorId, startDate, endDate);
    }

    @DeleteMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('admin')")
    public MessageResponse deleteSchedule(
            @PathVariable Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        workScheduleService.deleteSchedule(doctorId, startDate, endDate);
        return new MessageResponse("Horaires supprimés avec succès");
    }

    @PutMapping("/{doctorId}")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public DoctorScheduleResponse updateSchedule(@PathVariable Integer doctorId, @Valid @RequestBody UpdateScheduleRequest request) {
        return workScheduleService.updateSchedule(doctorId, request);
    }

    @PostMapping("/copy-previous-week")
    @PreAuthorize("hasAnyRole('admin', 'doctor', 'secretary')")
    public ResponseEntity<DoctorScheduleResponse> copyPreviousWeek(@Valid @RequestBody CopyPreviousWeekRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workScheduleService.copyPreviousWeek(request));
    }
}
