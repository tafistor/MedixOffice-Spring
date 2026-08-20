package com.medixoffice.backend.dto.passwordreset;

public record RequestResetCodeResponse(String message, int expiresIn) {
}
