package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Integer> {
}
