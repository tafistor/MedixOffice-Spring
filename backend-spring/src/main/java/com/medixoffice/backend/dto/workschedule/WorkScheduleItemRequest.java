package com.medixoffice.backend.dto.workschedule;

import com.medixoffice.backend.entity.WorkDay;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record WorkScheduleItemRequest(
        @NotNull LocalDate date,
        @NotNull WorkDay dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Integer durationMinutes,
        Boolean isAvailable,
        Integer slotOrder
) {
}
