package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.payment.CreatePaymentRequest;
import com.medixoffice.backend.dto.payment.PaymentUrlResponse;
import com.medixoffice.backend.service.PayPalService;
import com.medixoffice.backend.service.StripeService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Had zero auth middleware in the Node version - now covered by the default
 * `.anyRequest().authenticated()` rule in SecurityConfig (no permitAll entry
 * here), plus role restrictions matching who can already interact with
 * invoices (admin/secretary/patient - doctors don't handle billing).
 */
@RestController
@RequestMapping("/payments")
@PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
public class PaymentController {

    private final StripeService stripeService;
    private final PayPalService payPalService;

    public PaymentController(StripeService stripeService, PayPalService payPalService) {
        this.stripeService = stripeService;
        this.payPalService = payPalService;
    }

    @PostMapping("/stripe")
    public PaymentUrlResponse createStripePayment(@Valid @RequestBody CreatePaymentRequest request) {
        String url = stripeService.createCheckoutSession(request.amount(), request.invoiceId());
        return new PaymentUrlResponse(url);
    }

    @PostMapping("/paypal")
    public PaymentUrlResponse createPaypalPayment(@Valid @RequestBody CreatePaymentRequest request) {
        String url = payPalService.createPayment(request.amount(), request.invoiceId());
        return new PaymentUrlResponse(url);
    }
}
