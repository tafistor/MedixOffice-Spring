package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.activitylog.ActivityLogResponse;
import com.medixoffice.backend.entity.ActivityLog;
import com.medixoffice.backend.repository.ActivityLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/activity-logs")
@PreAuthorize("hasRole('admin')")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogController(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping
    public List<ActivityLogResponse> getRecentActivity() {
        return activityLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 200)).stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        return new ActivityLogResponse(log.getId(), log.getUserId(), log.getUserEmail(), log.getRole(),
                log.getMethod(), log.getPath(), log.getCreatedAt());
    }
}
