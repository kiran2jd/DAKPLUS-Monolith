package com.mockanytime.dakplus.assessment.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "topics")
public class Topic {
    @Id
    private String id;
    private String name; // Represents "Exam Category" (e.g., Dept Exams, GDS to MTS)
    private String description;
    private String icon; // Icon name for UI
    private String imageUrl; // URL for topic image
    private String pdfUrl; // URL for topic PDF
    private java.util.List<String> courseIds; // ["MTS", "PMMG", "PASA"]
    private boolean syllabusOnly = false;

    public Topic(String id, String name, String description, String icon, String imageUrl, String pdfUrl, java.util.List<String> courseIds, boolean syllabusOnly) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.imageUrl = imageUrl;
        this.pdfUrl = pdfUrl;
        this.courseIds = courseIds;
        this.syllabusOnly = syllabusOnly;
    }
}
