package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.WorkDay;
import com.medixoffice.backend.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Integer> {

    List<WorkSchedule> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate startDate, LocalDate endDate);

    long deleteByDoctorIdAndDateIn(Integer doctorId, List<LocalDate> dates);

    long deleteByDoctorIdAndDateBetween(Integer doctorId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(w) > 0 FROM WorkSchedule w WHERE w.doctor.id = :doctorId AND w.dayOfWeek = :dayOfWeek " +
            "AND w.isAvailable = true AND w.startTime <= :time AND w.endTime >= :time")
    boolean hasAvailableSlot(@Param("doctorId") Integer doctorId, @Param("dayOfWeek") WorkDay dayOfWeek, @Param("time") LocalTime time);
}
