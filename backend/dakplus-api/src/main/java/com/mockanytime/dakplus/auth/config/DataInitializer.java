package com.mockanytime.dakplus.auth.config;

import com.mockanytime.dakplus.auth.model.User;
import com.mockanytime.dakplus.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository) {
        return args -> {
            String adminEmail = "admin@dakplus.in";
            Optional<User> existingAdmin = userRepository.findByEmail(adminEmail);

            if (existingAdmin.isEmpty()) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                User admin = new User();
                admin.setFullName("Admin User");
                admin.setEmail(adminEmail);
                admin.setPhoneNumber("0000000000");
                admin.setRole("ADMIN");
                admin.setPassword(encoder.encode("admin123")); // Secure hashed password
                admin.setSubscriptionTier("PREMIUM");

                userRepository.save(admin);
                System.out.println("Default Admin user created: " + adminEmail);
            } else {
                System.out.println("Admin user already exists: " + adminEmail);
            }
        };
    }
}
