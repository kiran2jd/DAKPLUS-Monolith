package com.mockanytime.dakplus.scoring.dto;

import java.util.Map;

public record UserDto(
        String id,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        String postalCircle,
        String division,
        String office,
        String cadre,
        String examType) {
    // Helper to extract from Map if needed
    @SuppressWarnings("unchecked")
    public static UserDto fromResponse(Map<String, Object> response) {
        Map<String, Object> userMap = (Map<String, Object>) response.get("user");
        return new UserDto(
                (String) userMap.get("id"),
                (String) userMap.get("fullName"),
                (String) userMap.get("email"),
                (String) userMap.get("phoneNumber"),
                (String) userMap.get("role"),
                (String) userMap.get("postalCircle"),
                (String) userMap.get("division"),
                (String) userMap.get("office"),
                (String) userMap.get("cadre"),
                (String) userMap.get("examType"));
    }
}
