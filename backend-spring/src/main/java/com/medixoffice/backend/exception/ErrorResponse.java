package com.medixoffice.backend.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(String message, int status, Instant timestamp, Map<String, String> errors) {

    public ErrorResponse(String message, int status) {
        this(message, status, Instant.now(), null);
    }
}
