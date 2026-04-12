package com.mockanytime.dakplus.assessment.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@Document(collection = "question_reports")
public class QuestionReport {
    @Id
    private String id;
    private String testId;
    private String questionId;
    private String userId;
    private String userName;
    private String reason; // e.g., WRONG_OPTIONS, SPELLING_ERROR, INCORRECT_TRANSLATION, OTHER
    private String comment;
    private String status = "PENDING"; // PENDING, RESOLVED, IGNORED
    private Date createdAt = new Date();

    public QuestionReport(String testId, String questionId, String userId, String userName, String reason, String comment) {
        this.testId = testId;
        this.questionId = questionId;
        this.userId = userId;
        this.userName = userName;
        this.reason = reason;
        this.comment = comment;
    }
}
