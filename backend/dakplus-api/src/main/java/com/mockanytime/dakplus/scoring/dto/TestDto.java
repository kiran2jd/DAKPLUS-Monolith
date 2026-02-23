package com.mockanytime.dakplus.scoring.dto;

import java.util.List;

public record TestDto(
                String id,
                String title,
                List<QuestionDto> questions) {
}
