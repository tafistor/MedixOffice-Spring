package com.medixoffice.backend.dto.payment;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePaymentRequest(@NotNull BigDecimal amount, @NotNull Integer invoiceId) {
}
