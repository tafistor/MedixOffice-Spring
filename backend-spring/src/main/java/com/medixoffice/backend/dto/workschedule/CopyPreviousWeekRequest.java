package com.medixoffice.backend.dto.workschedule;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CopyPreviousWeekRequest(@NotNull Integer doctorId, @NotNull LocalDate currentWeekStart) {
}
