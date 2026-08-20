package com.medixoffice.backend.dto.secretaryspecialty;

import java.util.List;

public record SecretaryWithSpecialtiesResponse(Integer id, String firstName, String lastName, String email, List<String> specialties) {
}
