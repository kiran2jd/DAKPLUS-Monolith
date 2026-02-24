package com.mockanytime.dakplus.assessment.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "subtopics")
public class Subtopic {
    @Id
    private String id;
    private String name; // Represents specific "Exam" (e.g., Paper 1, Paper 2)
    private String description;
    private String topicId; // Links to Exam Category

    public Subtopic(String id, String name, String description, String topicId) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.topicId = topicId;
    }
}
