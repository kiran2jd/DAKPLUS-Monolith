package com.mockanytime.dakplus.payment.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "purchases")
public class Purchase {
    @Id
    private String id;
    private String userId;
    private String itemId; // "SUBSCRIPTION_PRO" or testId
    private String itemType; // "SUBSCRIPTION" or "TEST"
    private double amount;
    private String orderId;
    private String paymentId;
    private String status; // CREATED, PAID, FAILED
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
