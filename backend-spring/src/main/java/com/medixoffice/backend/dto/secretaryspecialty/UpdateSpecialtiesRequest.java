package com.medixoffice.backend.dto.secretaryspecialty;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateSpecialtiesRequest(@NotNull Integer userId, List<String> specialties) {
}
