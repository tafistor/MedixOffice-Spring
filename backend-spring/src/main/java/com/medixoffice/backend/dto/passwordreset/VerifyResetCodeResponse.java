package com.medixoffice.backend.dto.passwordreset;

public record VerifyResetCodeResponse(String message, boolean verified) {
}
