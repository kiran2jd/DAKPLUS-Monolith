package com.mockanytime.dakplus.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "otps")
public class Otp {
    @Id
    private String id;

    @Indexed(unique = true)
    private String identifier;

    private String code;

    @Indexed(expireAfterSeconds = 300) // 5 minutes TTL
    private LocalDateTime createdAt;

    private int attempts;
    private boolean verified;

    public Otp() {
        this.createdAt = LocalDateTime.now();
        this.attempts = 0;
        this.verified = false;
    }

    public Otp(String identifier, String code) {
        this();
        this.identifier = identifier;
        this.code = code;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(createdAt.plusMinutes(5));
    }

    public boolean hasExceededAttempts() {
        return attempts >= 3;
    }
}
