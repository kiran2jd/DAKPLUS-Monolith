package com.mockanytime.dakplus.assessment.exception;

import lombok.Getter;

@Getter
public class AiRateLimitException extends RuntimeException {
    private final long waitTimeSeconds;

    public AiRateLimitException(String message, long waitTimeSeconds) {
        super(message);
        this.waitTimeSeconds = waitTimeSeconds;
    }
}
