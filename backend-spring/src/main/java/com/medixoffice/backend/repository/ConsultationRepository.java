package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Integer> {

    List<Consultation> findByPatientId(Integer patientId);

    long countByDate(LocalDate date);
}
