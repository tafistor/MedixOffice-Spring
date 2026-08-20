package com.medixoffice.backend.service;

import com.medixoffice.backend.exception.PaymentException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class StripeService {

    private final String secretKey;
    private final String appUrl;

    public StripeService(@Value("${stripe.secret-key}") String secretKey, @Value("${app.url}") String appUrl) {
        this.secretKey = secretKey;
        this.appUrl = appUrl;
    }

    public String createCheckoutSession(BigDecimal amount, Integer invoiceId) {
        Stripe.apiKey = secretKey;

        long unitAmountCents = amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();

        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(appUrl + "/billing?payment_success=true&invoice_id=" + invoiceId)
                .setCancelUrl(appUrl + "/billing?payment_success=false&invoice_id=" + invoiceId)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("eur")
                                .setUnitAmount(unitAmountCents)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Medical Invoice Payment")
                                        .build())
                                .build())
                        .build())
                .build();

        try {
            Session session = Session.create(params);
            return session.getUrl();
        } catch (StripeException e) {
            throw new PaymentException("Stripe API error", e);
        }
    }
}
