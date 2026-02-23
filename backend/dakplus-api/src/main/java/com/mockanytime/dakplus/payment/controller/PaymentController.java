package com.mockanytime.dakplus.payment.controller;

import com.mockanytime.dakplus.auth.service.AuthService;
import com.mockanytime.dakplus.payment.model.Purchase;
import com.mockanytime.dakplus.payment.repository.PurchaseRepository;
import com.mockanytime.dakplus.payment.service.RazorpayService;
import com.razorpay.RazorpayException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;
    private final PurchaseRepository purchaseRepository;
    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request) {
        System.out.println("Received create-order request: " + request);
        try {
            if (request.get("amount") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            double amount = Double.parseDouble(request.get("amount").toString());
            String receipt = (String) request.getOrDefault("receipt", "txn_" + System.currentTimeMillis());
            String userId = (String) request.get("userId");
            String itemId = (String) request.getOrDefault("itemId", "SUBSCRIPTION_PRO");
            String itemType = (String) request.getOrDefault("itemType", "SUBSCRIPTION");

            System.out.println("Initiating order creation for amount: " + amount);
            String orderId = razorpayService.createOrder(amount, receipt);
            System.out.println("Order created successfully: " + orderId);

            // Create Purchase record
            Purchase purchase = new Purchase();
            purchase.setUserId(userId);
            purchase.setItemId(itemId);
            purchase.setItemType(itemType);
            purchase.setAmount(amount);
            purchase.setOrderId(orderId);
            purchase.setStatus("CREATED");
            purchaseRepository.save(purchase);

            return ResponseEntity.ok(Map.of("orderId", orderId, "amount", amount, "currency", "INR"));
        } catch (RazorpayException e) {
            System.err.println("RazorpayException during create-order: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected exception during create-order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to create order: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        return processPaymentVerification(request);
    }

    /**
     * Handle Razorpay redirect callback (GET)
     * This is used when Razorpay redirects the user back after payment.
     */
    @GetMapping("/callback")
    public void handleCallback(@RequestParam Map<String, String> params, HttpServletResponse response)
            throws IOException {
        System.out.println("Received Razorpay callback params: " + params);

        // Even if verification fails or is handled asynchronously via webhook later,
        // we redirect the user back to the dashboard.
        // In a real scenario, we verify here and show success/failure page or
        // dashboard.

        String orderId = params.get("razorpay_order_id");
        if (orderId != null) {
            processPaymentVerification(params);
        }

        // Redirect to dashboard
        String redirectUrl = frontendUrl + "/dashboard?payment=success";
        response.sendRedirect(redirectUrl);
    }

    private ResponseEntity<?> processPaymentVerification(Map<String, String> request) {
        String orderId = request.get("razorpay_order_id");
        String paymentId = request.get("razorpay_payment_id");
        String signature = request.get("razorpay_signature");

        System.out.println("Verifying payment: orderId=" + orderId + ", paymentId=" + paymentId);

        boolean isValid = razorpayService.verifySignature(orderId, paymentId, signature);
        if (isValid) {
            // Update Purchase record
            Purchase purchase = purchaseRepository.findByOrderId(orderId).orElse(null);
            if (purchase != null) {
                purchase.setPaymentId(paymentId);
                purchase.setStatus("PAID");
                purchase.setUpdatedAt(LocalDateTime.now());
                purchaseRepository.save(purchase);

                String targetUserId = purchase.getUserId();

                // If ItemType is SUBSCRIPTION, update user role
                if ("SUBSCRIPTION".equals(purchase.getItemType())) {
                    try {
                        System.out.println("Upgrading tier for user: " + targetUserId);
                        authService.updateTier(targetUserId, "PREMIUM");
                        System.out.println("User tier upgraded to PREMIUM for userId: " + targetUserId);
                    } catch (Exception e) {
                        System.err.println("Failed to update user tier: " + e.getMessage());
                    }
                } else if ("EXAM".equals(purchase.getItemType()) || "TEST".equals(purchase.getItemType())) {
                    try {
                        String itemId = purchase.getItemId();
                        System.out.println("Unlocking exam " + itemId + " for user: " + targetUserId);
                        authService.unlockExam(targetUserId, itemId);
                        System.out.println("Exam unlocked for userId: " + targetUserId);
                    } catch (Exception e) {
                        System.err.println("Failed to unlock exam: " + e.getMessage());
                    }
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified"));
        } else {
            // Update Purchase as Failed
            Purchase purchase = purchaseRepository.findByOrderId(orderId).orElse(null);
            if (purchase != null) {
                purchase.setStatus("FAILED");
                purchase.setUpdatedAt(LocalDateTime.now());
                purchaseRepository.save(purchase);
            }

            return ResponseEntity.badRequest()
                    .body(Map.of("status", "failure", "message", "Invalid payment signature"));
        }
    }

    @GetMapping("/check-access")
    public ResponseEntity<?> checkAccess(@RequestParam String userId, @RequestParam String itemId) {
        boolean hasAccess = purchaseRepository.existsByUserIdAndItemIdAndStatus(userId, itemId, "PAID");
        return ResponseEntity.ok(Map.of("hasAccess", hasAccess));
    }

    @GetMapping("/user-purchases")
    public ResponseEntity<?> getUserPurchases(@RequestParam String userId) {
        return ResponseEntity.ok(purchaseRepository.findByUserId(userId)
                .stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .toList());
    }
}
