package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.Appointment;
import com.medixoffice.backend.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    List<Appointment> findByDoctorId(Integer doctorId);

    List<Appointment> findByPatientId(Integer patientId);

    List<Appointment> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate startDate, LocalDate endDate);

    long countByDateAndStatusNot(LocalDate date, AppointmentStatus status);

    boolean existsByDoctorIdAndDateAndTimeAndStatusNot(Integer doctorId, LocalDate date, String time, AppointmentStatus status);
}
