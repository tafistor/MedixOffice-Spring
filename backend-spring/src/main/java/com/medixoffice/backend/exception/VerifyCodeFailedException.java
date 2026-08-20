package com.medixoffice.backend.exception;

import org.springframework.http.HttpStatus;

/** Carries the extra fields the frontend actually reads (remainingAttempts, maxAttemptsReached) - status varies per case (400 vs 429). */
public class VerifyCodeFailedException extends RuntimeException {

    private final HttpStatus status;
    private final Integer remainingAttempts;
    private final Boolean maxAttemptsReached;

    public VerifyCodeFailedException(String message, HttpStatus status, Integer remainingAttempts, Boolean maxAttemptsReached) {
        super(message);
        this.status = status;
        this.remainingAttempts = remainingAttempts;
        this.maxAttemptsReached = maxAttemptsReached;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Integer getRemainingAttempts() {
        return remainingAttempts;
    }

    public Boolean getMaxAttemptsReached() {
        return maxAttemptsReached;
    }
}
