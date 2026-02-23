package com.mockanytime.dakplus.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class RazorpayService {

    @Value("${razorpay.mode:live}")
    private String mode; // "live" or "dummy"

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private RazorpayClient client;

    @PostConstruct
    public void init() {
        if ("live".equalsIgnoreCase(mode)) {
            try {
                this.client = new RazorpayClient(keyId, keySecret);
            } catch (RazorpayException e) {
                System.err.println("Failed to initialize Razorpay Client: " + e.getMessage());
            }
        }
    }

    public String createOrder(double amount, String receipt) throws RazorpayException {
        if ("dummy".equalsIgnoreCase(mode)) {
            System.out.println("RAZORPAY DUMMY MODE: Creating order for " + amount);
            return "order_dummy_" + System.currentTimeMillis();
        }

        if (client == null) {
            throw new RazorpayException("Razorpay Client not initialized");
        }

        JSONObject orderRequest = new JSONObject();
        // Razorpay expects amount in paise (e.g., 500.00 -> 50000)
        orderRequest.put("amount", (int) (amount * 100));
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", receipt);

        Order order = client.orders.create(orderRequest);
        return order.get("id");
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if ("dummy".equalsIgnoreCase(mode)) {
            System.out.println("RAZORPAY DUMMY MODE: Verifying signature for " + orderId);
            return true; // Always valid in dummy mode
        }

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            return Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (RazorpayException e) {
            return false;
        }
    }
}
