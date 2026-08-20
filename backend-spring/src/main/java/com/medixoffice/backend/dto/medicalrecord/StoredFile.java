package com.medixoffice.backend.dto.medicalrecord;

/** File metadata shape matching Node's multer-derived JSON, so the stored labResults/attachments arrays stay frontend-compatible. */
public record StoredFile(String name, String filename, String path, String mimetype, long size) {
}
