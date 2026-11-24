package com.medixoffice.backend.dto.secretaryspecialty;

public record CreateSecretaryResponse(String message, SecretaryWithSpecialtiesResponse secretary, String temporaryPassword) {
}
