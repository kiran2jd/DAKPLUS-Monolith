package com.mockanytime.dakplus.auth.controller;

import com.mockanytime.dakplus.auth.model.Notification;
import com.mockanytime.dakplus.auth.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestHeader("X-User-Id") String userId) {
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/create")
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        notification.setCreatedAt(new java.util.Date());
        notification.setRead(false);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }
}
