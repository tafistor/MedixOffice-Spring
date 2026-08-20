package com.medixoffice.backend.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CapturePaypalPaymentRequest(@NotBlank String orderId, @NotNull Integer invoiceId) {
}
