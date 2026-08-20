package com.medixoffice.backend.dto.workschedule;

import java.util.List;

public record DoctorScheduleResponse(Integer id, DoctorSummary doctor, List<WorkScheduleResponse> schedules) {

    public record DoctorSummary(String firstName, String lastName) {
    }
}
