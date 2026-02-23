package com.mockanytime.dakplus.scoring.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_HOST:http://auth-service.railway.internal:8081}")
public interface AuthClient {
    @GetMapping("/auth/profile")
    Map<String, Object> getUserProfile(@RequestHeader("X-User-Id") String userId);

    @org.springframework.web.bind.annotation.PostMapping("/auth/notifications/internal/create")
    void createNotification(@org.springframework.web.bind.annotation.RequestBody Map<String, Object> notification);
}
