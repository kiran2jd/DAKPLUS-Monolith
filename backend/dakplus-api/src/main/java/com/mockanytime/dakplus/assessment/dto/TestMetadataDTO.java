package com.mockanytime.dakplus.assessment.dto;

import lombok.Data;
import java.util.List;

@Data
public class TestMetadataDTO {
    private String topicId;
    private String subtopicId;
    private List<String> courseIds;
    private String confidenceScore; // high, medium, low
}
