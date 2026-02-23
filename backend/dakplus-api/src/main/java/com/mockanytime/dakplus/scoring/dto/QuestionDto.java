package com.mockanytime.dakplus.scoring.dto;

import java.util.List;

public record QuestionDto(
        String id,
        String text,
        String type,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points) {
}
