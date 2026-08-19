package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {

    Optional<Doctor> findByUserId(Integer userId);

    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);
}
