package com.medixoffice.backend.repository;

import com.medixoffice.backend.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {

    List<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
