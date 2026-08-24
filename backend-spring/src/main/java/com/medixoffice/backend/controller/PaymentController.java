package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.invoice.InvoiceUpdateRequest;
import com.medixoffice.backend.dto.payment.CapturePaypalPaymentRequest;
import com.medixoffice.backend.dto.payment.CreatePaymentRequest;
import com.medixoffice.backend.dto.payment.PaymentUrlResponse;
import com.medixoffice.backend.entity.InvoiceStatus;
import com.medixoffice.backend.exception.PaymentException;
import com.medixoffice.backend.service.InvoiceService;
import com.medixoffice.backend.service.PayPalService;
import com.medixoffice.backend.service.StripeService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/payments")
@PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
public class PaymentController {

    private final StripeService stripeService;
    private final PayPalService payPalService;
    private final InvoiceService invoiceService;

    public PaymentController(StripeService stripeService, PayPalService payPalService, InvoiceService invoiceService) {
        this.stripeService = stripeService;
        this.payPalService = payPalService;
        this.invoiceService = invoiceService;
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


    @PostMapping("/paypal/capture")
    public MessageResponse capturePaypalPayment(@Valid @RequestBody CapturePaypalPaymentRequest request) {
        boolean captured = payPalService.capturePayment(request.orderId());
        if (!captured) {
            throw new PaymentException("PayPal payment was not completed", null);
        }
        invoiceService.updateInvoice(request.invoiceId(),
                new InvoiceUpdateRequest(null, null, null, null, null, InvoiceStatus.Paid));
        return new MessageResponse("Payment captured successfully");
    }
}
