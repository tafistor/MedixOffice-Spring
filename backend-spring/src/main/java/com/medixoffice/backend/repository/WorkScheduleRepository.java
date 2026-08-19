package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Integer> {

    List<WorkSchedule> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate startDate, LocalDate endDate);

    long deleteByDoctorIdAndDateIn(Integer doctorId, List<LocalDate> dates);

    long deleteByDoctorIdAndDateBetween(Integer doctorId, LocalDate startDate, LocalDate endDate);
}
