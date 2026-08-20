package com.medixoffice.backend.dto.doctor;

public record CreateDoctorResponse(String message, DoctorResponse doctor, String temporaryPassword) {
}
