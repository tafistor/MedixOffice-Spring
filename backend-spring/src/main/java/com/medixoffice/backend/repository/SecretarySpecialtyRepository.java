package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.SecretarySpecialty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecretarySpecialtyRepository extends JpaRepository<SecretarySpecialty, Integer> {

    List<SecretarySpecialty> findByUserId(Integer userId);

    long deleteByUserId(Integer userId);

    List<SecretarySpecialty> findBySpecialty(String specialty);
}
