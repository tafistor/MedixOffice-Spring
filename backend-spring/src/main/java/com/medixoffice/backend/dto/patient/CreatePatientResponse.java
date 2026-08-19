package com.medixoffice.backend.dto.patient;

public record CreatePatientResponse(String message, PatientResponse patient, String temporaryPassword) {
}
