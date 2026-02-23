package com.mockanytime.dakplus.auth.controller;

import com.mockanytime.dakplus.auth.model.User;
import com.mockanytime.dakplus.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for handling authentication-related requests.
 * Provides endpoints for OTP management, user registration, login, and profile
 * updates.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Data Transfer Objects (DTOs) for various authentication flows
    record VerifyOtpRequest(String identifier, String otp, boolean persistent) {
    }

    record RegisterRequest(
            @NotBlank(message = "Name is required") String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Phone number is required") String phoneNumber,
            String role,
            @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,
            boolean persistent,
            boolean notificationsEnabled,
            String postalCircle,
            String division,
            String office,
            String cadre,
            String examType) {
    }

    record SendOtpRequest(String identifier) {
    }

    record LoginRequest(String identifier, String password, boolean persistent) {
    } // identifier can be email or phone

    record UpdateProfileRequest(String fullName, String email, String bio, String institution, String avatar,
            String password) {
    }

    /**
     * Sends a one-time password (OTP) to the specified phone number.
     * 
     * @param request The request containing the target phone number.
     * @return ResponseEntity with success or error message.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest request) {
        try {
            // Trigger OTP sending logic via AuthService
            authService.sendOtp(request.identifier());
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (Exception e) {
            // Return error status if OTP sending fails
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Resends the OTP to the specified identifier (Email or SMS).
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody SendOtpRequest request) {
        try {
            authService.sendOtp(request.identifier());
            return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Verifies the OTP provided by the user and returns an authentication token.
     * 
     * @param request The request containing phone number and the OTP to verify.
     * @return ResponseEntity containing JWT token if successful, or registration
     *         prompt if new user.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            // Verify OTP and check if user profile exists
            Map<String, Object> result = authService.verifyOtp(request.identifier(), request.otp(),
                    request.persistent());
            Map<String, Object> response = new HashMap<>();

            // If user is new, flag for registration
            if (result.containsKey("status") && "NEW_USER".equals(result.get("status"))) {
                response.put("is_new_user", true);
                response.put("message", "OTP verified, please register");
            } else {
                // If existing user, return JWT access token and user info
                response.put("access_token", result.get("token"));
                response.put("user", result.get("user"));
                response.put("is_new_user", false);
                response.put("message", "Login successful");
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle verification errors
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Registers a new user with the provided details.
     * 
     * @param request User registration data including name, email, phone, and role.
     * @return ResponseEntity with JWT token and user profile.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // Create user object from request
            User user = new User(request.fullName(), request.email(), request.phoneNumber(), request.role());
            user.setNotificationsEnabled(request.notificationsEnabled());
            user.setPostalCircle(request.postalCircle());
            user.setDivision(request.division());
            user.setOffice(request.office());
            user.setCadre(request.cadre());
            user.setExamType(request.examType());

            if (request.password() != null && !request.password().isEmpty()) {
                user.setPassword(request.password());
            }
            // Delegate registration to AuthService
            Map<String, Object> result = authService.register(user, request.persistent());
            return ResponseEntity.ok(Map.of(
                    "access_token", result.get("token"),
                    "user", result.get("user"),
                    "message", "User registered successfully"));
        } catch (RuntimeException e) {
            // Return error if registration fails (e.g., user already exists)
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Authenticates a user using email or phone number and a password.
     * 
     * @param request Login credentials.
     * @return ResponseEntity with JWT token and user profile if credentials match.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Attempt login via AuthService
            Map<String, Object> result = authService.loginWithPassword(request.identifier(), request.password(),
                    request.persistent());
            return ResponseEntity.ok(Map.of(
                    "access_token", result.get("token"),
                    "user", result.get("user"),
                    "message", "Login successful"));
        } catch (RuntimeException e) {
            // Handle authentication failure
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Retrieves the current user profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User ID required"));
            }
            User user = authService.getUserById(userId);
            return ResponseEntity.ok(Map.of("user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Updates the profile information for the authenticated user.
     * 
     * @param userId  The ID of the user (resolved via Gateway/JWT).
     * @param request The updated profile fields.
     * @return ResponseEntity with the updated user profile.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody UpdateProfileRequest request) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User ID required"));
            }

            // Map request DTO to User domain model
            User updates = new User();
            updates.setFullName(request.fullName());
            updates.setEmail(request.email());
            updates.setBio(request.bio());
            updates.setInstitution(request.institution());
            updates.setAvatar(request.avatar());
            if (request.password() != null && !request.password().isEmpty()) {
                updates.setPassword(request.password());
            }

            // Apply updates via AuthService
            User updatedUser = authService.updateProfile(userId, updates);
            return ResponseEntity.ok(Map.of("user", updatedUser, "message", "Profile updated successfully"));
        } catch (RuntimeException e) {
            // Handle update errors
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Validates if the current session is still active and hasn't been superseded
     */
    @GetMapping("/validate-session")
    public ResponseEntity<?> validateSession(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Session-Id") String sessionId) {
        // Check session validity against stored data
        boolean isValid = authService.validateSession(userId, sessionId);
        if (isValid) {
            return ResponseEntity.ok(Map.of("valid", true));
        } else {
            // Invalidate if session mismatch found
            return ResponseEntity.status(401)
                    .body(Map.of("valid", false, "message", "Session invalidated. Another login detected."));
        }
    }

    /**
     * Internal endpoint to update user tier (called by payment-service)
     */
    @PutMapping("/internal/update-tier")
    public ResponseEntity<?> updateTier(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String tier = request.get("tier");
        try {
            User updatedUser = authService.updateTier(userId, tier);
            return ResponseEntity.ok(Map.of("user", updatedUser, "message", "Tier updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Internal endpoint to unlock a specific exam (called by payment-service)
     */
    @PutMapping("/internal/unlock-exam")
    public ResponseEntity<?> unlockExam(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String examId = request.get("examId");
        try {
            User updatedUser = authService.unlockExam(userId, examId);
            return ResponseEntity.ok(Map.of("user", updatedUser, "message", "Exam unlocked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
