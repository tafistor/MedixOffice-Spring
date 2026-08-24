package com.medixoffice.backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medixoffice.backend.exception.PaymentException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class PayPalService {

    private static final Logger log = LoggerFactory.getLogger(PayPalService.class);

    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final String appUrl;
    private final RestClient restClient;

    public PayPalService(@Value("${paypal.client-id}") String clientId,
                          @Value("${paypal.client-secret}") String clientSecret,
                          @Value("${paypal.base-url}") String baseUrl,
                          @Value("${app.url}") String appUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrl = baseUrl;
        this.appUrl = appUrl;
        this.restClient = RestClient.create();
        log.info("PayPal client configured: baseUrl={}, clientId len={} hash={}, clientSecret len={} hash={}",
                baseUrl, clientId.length(), clientId.hashCode(), clientSecret.length(), clientSecret.hashCode());
    }

    public String createPayment(BigDecimal amount, Integer invoiceId) {
        String accessToken = fetchAccessToken();

        Map<String, Object> orderRequest = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                        "amount", Map.of(
                                "currency_code", "EUR",
                                "value", amount.toPlainString()
                        )
                )),
                "application_context", Map.of(
                        "return_url", appUrl + "/billing?payment_success=true&invoice_id=" + invoiceId,
                        "cancel_url", appUrl + "/billing?payment_success=false&invoice_id=" + invoiceId
                )
        );

        try {
            PayPalOrderResponse response = restClient.post()
                    .uri(baseUrl + "/v2/checkout/orders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(orderRequest)
                    .retrieve()
                    .body(PayPalOrderResponse.class);

            return response.links().stream()
                    .filter(link -> "approve".equals(link.rel()))
                    .map(PayPalLink::href)
                    .findFirst()
                    .orElseThrow(() -> new PaymentException("No approval link found in PayPal response", null));
        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentException("PayPal API error", e);
        }
    }

   
    public boolean capturePayment(String orderId) {
        String accessToken = fetchAccessToken();

        try {
            PayPalCaptureResponse response = restClient.post()
                    .uri(baseUrl + "/v2/checkout/orders/" + orderId + "/capture")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(PayPalCaptureResponse.class);

            return response != null && "COMPLETED".equals(response.status());
        } catch (Exception e) {
            throw new PaymentException("PayPal capture failed", e);
        }
    }

    private record PayPalCaptureResponse(String id, String status) {
    }

    private String fetchAccessToken() {
        String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        try {
            PayPalTokenResponse response = restClient.post()
                    .uri(baseUrl + "/v1/oauth2/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(PayPalTokenResponse.class);
            return response.accessToken();
        } catch (Exception e) {
            throw new PaymentException("PayPal authentication error", e);
        }
    }

    private record PayPalTokenResponse(@JsonProperty("access_token") String accessToken) {
    }

    private record PayPalOrderResponse(String id, List<PayPalLink> links) {
    }

    private record PayPalLink(String href, String rel) {
    }
}
