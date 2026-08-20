package com.medixoffice.backend.dto.workschedule;

import com.medixoffice.backend.entity.WorkDay;

import java.time.LocalDate;
import java.time.LocalTime;

public record WorkScheduleResponse(
        Integer id,
        LocalDate date,
        WorkDay dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Integer durationMinutes,
        boolean isAvailable,
        Integer slotOrder
) {
}
