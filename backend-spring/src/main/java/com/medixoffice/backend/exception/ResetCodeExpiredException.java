package com.medixoffice.backend.exception;

public class ResetCodeExpiredException extends RuntimeException {

    public ResetCodeExpiredException(String message) {
        super(message);
    }
}
