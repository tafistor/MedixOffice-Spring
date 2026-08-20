package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.workschedule.CopyPreviousWeekRequest;
import com.medixoffice.backend.dto.workschedule.CreateScheduleRequest;
import com.medixoffice.backend.dto.workschedule.DoctorScheduleResponse;
import com.medixoffice.backend.dto.workschedule.UpdateScheduleRequest;
import com.medixoffice.backend.dto.workschedule.WorkScheduleItemRequest;
import com.medixoffice.backend.dto.workschedule.WorkScheduleResponse;
import com.medixoffice.backend.entity.Doctor;
import com.medixoffice.backend.entity.WorkSchedule;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.DoctorRepository;
import com.medixoffice.backend.repository.WorkScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;
    private final DoctorRepository doctorRepository;

    public WorkScheduleService(WorkScheduleRepository workScheduleRepository, DoctorRepository doctorRepository) {
        this.workScheduleRepository = workScheduleRepository;
        this.doctorRepository = doctorRepository;
    }

    @Transactional
    public DoctorScheduleResponse createSchedule(CreateScheduleRequest request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));

        List<WorkSchedule> created = replaceSchedules(doctor, request.doctorId(), request.schedules());
        return toResponse(doctor, created);
    }

    @Transactional
    public DoctorScheduleResponse updateSchedule(Integer doctorId, UpdateScheduleRequest request) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));

        List<WorkSchedule> updated = replaceSchedules(doctor, doctorId, request.schedules());
        return toResponse(doctor, updated);
    }

    @Transactional(readOnly = true)
    public DoctorScheduleResponse getDoctorSchedule(Integer doctorId, LocalDate startDate, LocalDate endDate) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));

        List<WorkSchedule> schedules = sorted(workScheduleRepository.findByDoctorIdAndDateBetween(doctorId, startDate, endDate));
        return toResponse(doctor, schedules);
    }

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getAllSchedules(LocalDate startDate, LocalDate endDate, String specialtiesParam) {
        List<Doctor> doctors;

        if (specialtiesParam != null && !specialtiesParam.isBlank()) {
            Set<Doctor> matched = new LinkedHashSet<>();
            for (String specialty : specialtiesParam.split(",")) {
                matched.addAll(doctorRepository.findBySpecializationContainingIgnoreCase(specialty.trim()));
            }
            doctors = new ArrayList<>(matched);
        } else {
            doctors = doctorRepository.findAll();
        }

        return doctors.stream()
                .map(doctor -> {
                    List<WorkSchedule> schedules = sorted(
                            workScheduleRepository.findByDoctorIdAndDateBetween(doctor.getId(), startDate, endDate));
                    return toResponse(doctor, schedules);
                })
                .toList();
    }

    @Transactional
    public void deleteSchedule(Integer doctorId, LocalDate startDate, LocalDate endDate) {
        long deleted = workScheduleRepository.deleteByDoctorIdAndDateBetween(doctorId, startDate, endDate);
        if (deleted == 0) {
            throw new ResourceNotFoundException("Aucun horaire trouvé pour la période spécifiée");
        }
    }

    @Transactional
    public DoctorScheduleResponse copyPreviousWeek(CopyPreviousWeekRequest request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Docteur non trouvé"));

        LocalDate previousWeekStart = request.currentWeekStart().minusDays(7);
        LocalDate previousWeekEnd = previousWeekStart.plusDays(4);

        List<WorkSchedule> previousSchedules = sorted(
                workScheduleRepository.findByDoctorIdAndDateBetween(request.doctorId(), previousWeekStart, previousWeekEnd));

        if (previousSchedules.isEmpty()) {
            throw new ResourceNotFoundException("Aucun horaire trouvé pour la semaine précédente");
        }

        LocalDate currentWeekEnd = request.currentWeekStart().plusDays(4);
        workScheduleRepository.deleteByDoctorIdAndDateBetween(request.doctorId(), request.currentWeekStart(), currentWeekEnd);

        List<WorkSchedule> newSchedules = previousSchedules.stream().map(old -> {
            WorkSchedule ws = new WorkSchedule(doctor, old.getDate().plusDays(7), old.getDayOfWeek(), old.getStartTime(), old.getEndTime());
            ws.setDurationMinutes(old.getDurationMinutes());
            ws.setAvailable(old.isAvailable());
            ws.setSlotOrder(old.getSlotOrder());
            return workScheduleRepository.save(ws);
        }).toList();

        return toResponse(doctor, newSchedules);
    }

    private List<WorkSchedule> replaceSchedules(Doctor doctor, Integer doctorId, List<WorkScheduleItemRequest> items) {
        List<LocalDate> dates = items.stream().map(WorkScheduleItemRequest::date).distinct().toList();
        workScheduleRepository.deleteByDoctorIdAndDateIn(doctorId, dates);

        return items.stream().map(item -> {
            WorkSchedule ws = new WorkSchedule(doctor, item.date(), item.dayOfWeek(), item.startTime(), item.endTime());
            if (item.durationMinutes() != null) ws.setDurationMinutes(item.durationMinutes());
            if (item.isAvailable() != null) ws.setAvailable(item.isAvailable());
            ws.setSlotOrder(item.slotOrder() != null ? item.slotOrder() : 1);
            return workScheduleRepository.save(ws);
        }).toList();
    }

    private List<WorkSchedule> sorted(List<WorkSchedule> schedules) {
        return schedules.stream()
                .sorted(Comparator.comparing(WorkSchedule::getDate).thenComparing(WorkSchedule::getSlotOrder))
                .toList();
    }

    private DoctorScheduleResponse toResponse(Doctor doctor, List<WorkSchedule> schedules) {
        var doctorSummary = new DoctorScheduleResponse.DoctorSummary(doctor.getUser().getFirstName(), doctor.getUser().getLastName());
        var scheduleResponses = schedules.stream().map(this::toItemResponse).toList();
        return new DoctorScheduleResponse(doctor.getId(), doctorSummary, scheduleResponses);
    }

    private WorkScheduleResponse toItemResponse(WorkSchedule ws) {
        return new WorkScheduleResponse(ws.getId(), ws.getDate(), ws.getDayOfWeek(), ws.getStartTime(), ws.getEndTime(),
                ws.getDurationMinutes(), ws.isAvailable(), ws.getSlotOrder());
    }
}
