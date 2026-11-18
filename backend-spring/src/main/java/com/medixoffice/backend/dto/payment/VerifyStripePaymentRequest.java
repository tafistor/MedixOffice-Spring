package com.medixoffice.backend.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyStripePaymentRequest(@NotBlank String sessionId, @NotNull Integer invoiceId) {
}
