package com.mockanytime.dakplus.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Entity representing a User in the system.
 * Stored in the "users" collection in MongoDB.
 */
@Document(collection = "users")
public class User {
    @Id
    private String id;
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    private String role; // STUDENT, TEACHER, ADMIN
    private String password; // BCrypt hashed password

    // Profile fields
    private String avatar;
    private String bio;
    private String institution;

    // Subscription
    private String subscriptionTier; // FREE, PREMIUM

    // Verification and timestamps
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String activeSessionId; // For single session enforcement
    private boolean notificationsEnabled;
    private String expoPushToken;

    // Additional Profile Fields
    private String postalCircle;
    private String division;
    private String office;
    private String cadre;
    private String examType;
    private List<String> unlockedExams;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.subscriptionTier = "FREE";
        this.emailVerified = false;
        this.emailVerified = false;
        this.notificationsEnabled = true;
        this.unlockedExams = new ArrayList<>();
    }

    public User(String fullName, String email, String phoneNumber, String role) {
        this();
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.role = role;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getSubscriptionTier() {
        return subscriptionTier;
    }

    public void setSubscriptionTier(String subscriptionTier) {
        this.subscriptionTier = subscriptionTier;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    /**
     * Updates the last login timestamp to the current time.
     */
    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }

    public String getActiveSessionId() {
        return activeSessionId;
    }

    public void setActiveSessionId(String activeSessionId) {
        this.activeSessionId = activeSessionId;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public String getExpoPushToken() {
        return expoPushToken;
    }

    public void setExpoPushToken(String expoPushToken) {
        this.expoPushToken = expoPushToken;
    }

    public String getPostalCircle() {
        return postalCircle;
    }

    public void setPostalCircle(String postalCircle) {
        this.postalCircle = postalCircle;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getOffice() {
        return office;
    }

    public void setOffice(String office) {
        this.office = office;
    }

    public String getCadre() {
        return cadre;
    }

    public void setCadre(String cadre) {
        this.cadre = cadre;
    }

    public String getExamType() {
        return examType;
    }

    public void setExamType(String examType) {
        this.examType = examType;
    }

    public List<String> getUnlockedExams() {
        return unlockedExams;
    }

    public void setUnlockedExams(List<String> unlockedExams) {
        this.unlockedExams = unlockedExams;
    }
}
