package com.mockanytime.dakplus.auth.service;

import com.mockanytime.dakplus.auth.model.User;
import com.mockanytime.dakplus.auth.repository.UserRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PushNotificationScheduler {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    public PushNotificationScheduler(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send motivational push notifications to all PREMIUM users daily
     * Cron format: Second Minute Hour DayOfMonth Month DayOfWeek
     * "0 0 10 * * ?" = 10:00 AM every day
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void sendDailyProReminders() {
        System.out.println("Running Daily PRO Reminder Push Notification Scheduler...");
        
        // Find all users who are PREMIUM and have a registered Push Token
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> messages = new ArrayList<>();
        
        for (User user : users) {
             if ("PREMIUM".equalsIgnoreCase(user.getSubscriptionTier()) && 
                 user.getExpoPushToken() != null && 
                 user.isNotificationsEnabled()) {
                 
                 Map<String, Object> message = new HashMap<>();
                 message.put("to", user.getExpoPushToken());
                 message.put("sound", "default");
                 message.put("title", "Practice Daily! \uD83D\uDCAA");
                 message.put("body", "You are a PRO member, practice daily to be on top of the leaderboard!");
                 messages.add(message);
             }
        }
        
        if (!messages.isEmpty()) {
            sendExpoPushNotifications(messages);
        } else {
             System.out.println("No users found to send push notifications to.");
        }
    }

    /**
     * Helper to call Expo Push API
     */
    private void sendExpoPushNotifications(List<Map<String, Object>> messages) {
        String expoPushUrl = "https://exp.host/--/api/v2/push/send";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(messages, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(expoPushUrl, request, String.class);
            System.out.println("Expo Push Response: " + response.getStatusCode() + " - " + response.getBody());
        } catch (Exception e) {
            System.err.println("Failed to send Expo Push Notifications: " + e.getMessage());
        }
    }
}
