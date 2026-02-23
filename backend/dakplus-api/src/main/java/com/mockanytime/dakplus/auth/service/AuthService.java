package com.mockanytime.dakplus.auth.service;

import com.mockanytime.dakplus.auth.model.Otp;
import com.mockanytime.dakplus.auth.model.User;
import com.mockanytime.dakplus.auth.repository.UserRepository;
import com.mockanytime.dakplus.auth.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil, OtpService otpService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Send OTP to phone number
     */
    public void sendOtp(String identifier) {
        Otp otp = otpService.createOtp(identifier);
        otpService.sendOtp(identifier, otp.getCode());
    }

    /**
     * Verify OTP and return JWT token if user exists, otherwise return NEW_USER
     * signal
     */
    public java.util.Map<String, Object> verifyOtp(String identifier, String otp, boolean persistent) {
        // Verify OTP using OtpService
        otpService.verifyOtp(identifier, otp);

        // Check if user exists by phone or email
        Optional<User> userOpt = userRepository.findByPhoneNumber(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.updateLastLogin();
            String sessionId = java.util.UUID.randomUUID().toString();
            user.setActiveSessionId(sessionId);
            userRepository.save(user);

            // 60 days in milliseconds: 60 * 24 * 60 * 60 * 1000 = 5,184,000,000
            long exp = persistent ? 5184000000L : 86400000L;
            String token = jwtUtil.generateToken(user.getPhoneNumber(), user.getRole(), user.getId(), sessionId, exp);
            return java.util.Map.of("token", token, "user", user);
        } else {
            return java.util.Map.of("status", "NEW_USER");
        }
    }

    /**
     * Register new user
     */
    public java.util.Map<String, Object> register(User user, boolean persistent) {
        if (userRepository.findByPhoneNumber(user.getPhoneNumber()).isPresent()) {
            throw new RuntimeException("User already exists with this phone number");
        }
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with this email address");
        }

        // Hash password if provided
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        String sessionId = java.util.UUID.randomUUID().toString();
        user.setActiveSessionId(sessionId);
        User savedUser = userRepository.save(user);

        // Send welcome email
        if (savedUser.getEmail() != null) {
            otpService.sendRegistrationSuccessEmail(savedUser.getEmail(), savedUser.getFullName());
        }

        long exp = persistent ? 5184000000L : 86400000L;
        String token = jwtUtil.generateToken(savedUser.getPhoneNumber(), savedUser.getRole(), savedUser.getId(),
                sessionId, exp);
        return java.util.Map.of("token", token, "user", savedUser);
    }

    /**
     * Login with email/phone and password
     */
    public java.util.Map<String, Object> loginWithPassword(String identifier, String password, boolean persistent) {
        // Try to find user by email or phone
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(identifier);
        }

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        User user = userOpt.get();

        // Verify password
        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Update last login
        user.updateLastLogin();
        String sessionId = java.util.UUID.randomUUID().toString();
        user.setActiveSessionId(sessionId);
        userRepository.save(user);

        long exp = persistent ? 5184000000L : 86400000L;
        String token = jwtUtil.generateToken(user.getPhoneNumber(), user.getRole(), user.getId(), sessionId, exp);
        return java.util.Map.of("token", token, "user", user);
    }

    /**
     * Update user profile
     */
    public User updateProfile(String userId, User updates) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();

        if (updates.getFullName() != null)
            user.setFullName(updates.getFullName());
        if (updates.getEmail() != null)
            user.setEmail(updates.getEmail());
        if (updates.getBio() != null)
            user.setBio(updates.getBio());
        if (updates.getInstitution() != null)
            user.setInstitution(updates.getInstitution());
        if (updates.getAvatar() != null)
            user.setAvatar(updates.getAvatar());

        // Update password if provided
        if (updates.getPassword() != null && !updates.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updates.getPassword()));
        }

        return userRepository.save(user);
    }

    /**
     * Update user subscription tier
     */
    public User updateTier(String userId, String tier) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();
        user.setSubscriptionTier(tier);
        return userRepository.save(user);
    }

    /**
     * Unlock a specific exam for a user
     */
    public User unlockExam(String userId, String examId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();
        if (user.getUnlockedExams() == null) {
            user.setUnlockedExams(new ArrayList<>());
        }
        if (!user.getUnlockedExams().contains(examId)) {
            user.getUnlockedExams().add(examId);
        }
        return userRepository.save(user);
    }

    /**
     * Validate if the provided session ID is the active one for the user
     */
    public boolean validateSession(String userId, String sessionId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(user -> sessionId != null && sessionId.equals(user.getActiveSessionId())).orElse(false);
    }
}
