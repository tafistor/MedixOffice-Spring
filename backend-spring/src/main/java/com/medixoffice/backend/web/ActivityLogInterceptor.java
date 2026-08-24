package com.medixoffice.backend.web;

import com.medixoffice.backend.entity.ActivityLog;
import com.medixoffice.backend.repository.ActivityLogRepository;
import com.medixoffice.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;


@Component
public class ActivityLogInterceptor implements HandlerInterceptor {

    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogInterceptor(ActivityLogRepository activityLogRepository, UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        if (!MUTATING_METHODS.contains(request.getMethod()) || response.getStatus() >= 400) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Integer userId)) {
            return;
        }

        String role = auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .orElse(null);
        String email = userRepository.findById(userId).map(u -> u.getEmail()).orElse(null);

        activityLogRepository.save(new ActivityLog(userId, email, role, request.getMethod(), request.getRequestURI()));
    }
}
