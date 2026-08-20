package com.medixoffice.backend.dto.workschedule;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateScheduleRequest(@NotEmpty List<WorkScheduleItemRequest> schedules) {
}
