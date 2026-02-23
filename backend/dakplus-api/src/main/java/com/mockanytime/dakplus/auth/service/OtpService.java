package com.mockanytime.dakplus.auth.service;

import com.mockanytime.dakplus.auth.model.Otp;
import com.mockanytime.dakplus.auth.repository.OtpRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final org.springframework.mail.javamail.JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${spring.mail.username:onboarding@resend.dev}")
    private String mailFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public OtpService(OtpRepository otpRepository, org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    /**
     * Generate a 6-digit OTP code
     */
    public String generateOtpCode() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Create and store OTP for a phone number
     */
    public Otp createOtp(String identifier) {
        // Delete any existing OTP for this identifier
        otpRepository.deleteByIdentifier(identifier);

        String code = generateOtpCode();
        Otp otp = new Otp(identifier, code);
        return otpRepository.save(otp);
    }

    /**
     * Verify OTP code for a phone number
     */
    public boolean verifyOtp(String identifier, String code) {
        // Dummy OTP for testing
        if ("123456".equals(code) && (identifier.equals("9999999999") || identifier.equals("admin@dakplus.in")
                || identifier.equals("student@dakplus.in"))) {
            System.out.println("DEBUG: Dummy OTP verified for " + identifier);
            return true;
        }

        Optional<Otp> otpOpt = otpRepository.findByIdentifier(identifier);

        if (otpOpt.isEmpty()) {
            throw new RuntimeException("No OTP found for this identifier");
        }

        Otp otp = otpOpt.get();

        // Check if already verified
        if (otp.isVerified()) {
            throw new RuntimeException("OTP already used");
        }

        // Check if expired
        if (otp.isExpired()) {
            otpRepository.delete(otp);
            throw new RuntimeException("OTP has expired");
        }

        // Check if max attempts exceeded
        if (otp.hasExceededAttempts()) {
            otpRepository.delete(otp);
            throw new RuntimeException("Maximum verification attempts exceeded");
        }

        // Increment attempts
        otp.incrementAttempts();
        otpRepository.save(otp);

        // Verify code
        if (!otp.getCode().equals(code)) {
            throw new RuntimeException("Invalid OTP code");
        }

        // Mark as verified and delete
        otp.setVerified(true);
        otpRepository.save(otp);
        otpRepository.delete(otp);

        return true;
    }

    @Value("${otp.delivery.mode:sms}")
    private String otpDeliveryMode; // "sms" or "email"

    @Value("${twilio.account.sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token}")
    private String twilioAuthToken;

    @Value("${twilio.from.number}")
    private String twilioFromNumber;

    @Value("${msg91.auth.key:}")
    private String msg91AuthKey;

    @Value("${msg91.template.id:}")
    private String msg91TemplateId;

    /**
     * Send OTP based on identifier type (Auto-detect Email vs SMS)
     */
    public void sendOtp(String identifier, String code) {
        if (isEmail(identifier)) {
            sendOtpViaEmail(identifier, code);
        } else {
            // Priority to Twilio, fallback to MSG91 if Twilio not configured
            if (twilioAccountSid != null && !twilioAccountSid.isEmpty() && !"...".equals(twilioAccountSid)) {
                sendOtpViaTwilio(identifier, code);
            } else {
                sendOtpViaMsg91(identifier, code);
            }
        }
    }

    private boolean isEmail(String identifier) {
        return identifier != null && identifier.contains("@") && identifier.contains(".");
    }

    public void sendOtpViaMsg91(String phoneNumber, String code) {
        if ((msg91AuthKey == null || msg91AuthKey.isEmpty() || "...".equals(msg91AuthKey))) {
            // Fallback for dev: log to console
            System.out.println("================================");
            System.out.println("LOG-ONLY MSG91 OTP for " + phoneNumber + ": " + code);
            System.out.println("================================");
            return;
        }

        try {
            // Add country code if missing (default to 91 for India)
            String mobile = phoneNumber.replace("+", "").replace(" ", "").replace("-", "");
            if (mobile.length() == 10) {
                mobile = "91" + mobile;
            }

            String encodedAuthKey = URLEncoder.encode(msg91AuthKey, StandardCharsets.UTF_8);
            String encodedTemplateId = URLEncoder.encode(msg91TemplateId, StandardCharsets.UTF_8);
            String encodedMobile = URLEncoder.encode(mobile, StandardCharsets.UTF_8);
            String encodedOtp = URLEncoder.encode(code, StandardCharsets.UTF_8);

            String url = "https://control.msg91.com/api/v5/otp?template_id=" + encodedTemplateId +
                    "&mobile=" + encodedMobile + "&authkey=" + encodedAuthKey + "&otp=" + encodedOtp;

            System.out.println("Sending MSG91 OTP to: " + mobile + " using template: " + msg91TemplateId);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("MSG91 OTP sent successfully to " + mobile + ". Response: " + response.getBody());
            } else {
                System.err.println("Failed to send MSG91 OTP to " + mobile + ". Status: " + response.getStatusCode()
                        + " Body: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Error sending MSG91 OTP: " + e.getMessage());
            e.printStackTrace();
            System.out.println("FALLBACK LOG OTP for " + phoneNumber + ": " + code);
        }
    }

    /**
     * Send OTP to phone number using Twilio
     */
    public void sendOtpViaTwilio(String phoneNumber, String code) {
        try {
            System.out.println("Attempting to send Twilio OTP to " + phoneNumber);
            // Twilio implementation using RestTemplate (avoiding large SDK for now to keep
            // it lightweight)
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

            RestTemplate restTemplate = new RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(twilioAccountSid, twilioAuthToken);

            org.springframework.util.MultiValueMap<String, String> map = new org.springframework.util.LinkedMultiValueMap<>();
            map.add("To", phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber);
            map.add("From", twilioFromNumber);
            map.add("Body", "Your DAKPLUS verification code is: " + code);

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> request = new org.springframework.http.HttpEntity<>(
                    map, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Twilio OTP sent successfully to " + phoneNumber);
            } else {
                System.err.println("Failed to send Twilio OTP (Switching to MSG91): " + response.getBody());
                sendOtpViaMsg91(phoneNumber, code);
            }
        } catch (Exception e) {
            System.err.println("Error sending Twilio OTP (Switching to MSG91): " + e.getMessage());
            sendOtpViaMsg91(phoneNumber, code);
        }
    }

    /**
     * Send OTP via Email (using Resend API)
     */
    public void sendOtpViaEmail(String email, String code) {
        String htmlContent = "<strong>Your DAKPLUS verification code is: " + code
                + "</strong><p>This code will expire in 5 minutes.</p>";
        sendEmail(email, "Your DAKPLUS Verification Code", htmlContent);
    }

    /**
     * Send Transactional Email (Registration Success)
     */
    public void sendRegistrationSuccessEmail(String email, String fullName) {
        String htmlContent = "<h1>Welcome to DAKPLUS APP!</h1><p>Hello " + fullName
                + ",</p><p>Welcome to our platform! Your registration was successful.</p><p>Best Regards,<br>DAKPLUS Team</p>";
        sendEmail(email, "Welcome to DAKPLUS APP!", htmlContent);
    }

    /**
     * Send Payment Success Email
     */
    public void sendPaymentSuccessEmail(String email, double amount) {
        String htmlContent = "<h2>Payment Received</h2><p>Thank you for your payment of INR " + amount
                + ".</p><p>Your Pro Subscription is now active!</p><p>Best Regards,<br>DAKPLUS Team</p>";
        sendEmail(email, "Payment Received - Pro Subscription Activated", htmlContent);
    }

    /**
     * Core Email Sending Logic (Prefer SMTP, fallback to Resend)
     */
    private void sendEmail(String to, String subject, String htmlContent) {
        // Try SMTP if host is configured
        if (mailHost != null && !mailHost.isEmpty() && !"...".equals(mailHost)) {
            sendEmailViaSmtp(to, subject, htmlContent);
        } else {
            sendEmailViaResend(to, subject, htmlContent);
        }
    }

    private void sendEmailViaSmtp(String to, String subject, String htmlContent) {
        try {
            System.out.println("Attempting to send SMTP email to: " + to + " via host: " + mailHost);
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("SMTP Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Error sending SMTP Email to " + to + ": " + e.getMessage());
            e.printStackTrace();
            // Fallback to Resend if SMTP fails
            System.out.println("Falling back to Resend API for: " + to);
            sendEmailViaResend(to, subject, htmlContent);
        }
    }

    /**
     * Core Resend API Integration
     */
    private void sendEmailViaResend(String to, String subject, String htmlContent) {
        if (resendApiKey == null || resendApiKey.isEmpty() || "...".equals(resendApiKey)) {
            System.out.println("================================");
            System.out.println("LOG-ONLY EMAIL to " + to + ": [" + subject + "] -> " + htmlContent);
            System.out.println("================================");
            return;
        }

        try {
            String url = "https://api.resend.com/emails";
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(resendApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("from", mailFrom);
            body.put("to", List.of(to));
            body.put("subject", subject);
            body.put("html", htmlContent);

            System.out.println("Sending Resend email to: " + to + " from: " + mailFrom);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Resend Email sent successfully to " + to + ". Response: " + response.getBody());
            } else {
                System.err.println("Failed to send Resend Email to " + to + ". Status: " + response.getStatusCode()
                        + " Body: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Error sending Resend Email: " + e.getMessage());
        }
    }
}
