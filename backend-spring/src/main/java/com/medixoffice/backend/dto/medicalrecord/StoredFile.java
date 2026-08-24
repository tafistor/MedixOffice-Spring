package com.medixoffice.backend.dto.medicalrecord;

public record StoredFile(String name, String filename, String path, String mimetype, long size) {
}
