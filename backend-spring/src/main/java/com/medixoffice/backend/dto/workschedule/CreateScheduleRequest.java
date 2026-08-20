package com.medixoffice.backend.dto.workschedule;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateScheduleRequest(@NotNull Integer doctorId, @NotEmpty List<WorkScheduleItemRequest> schedules) {
}
