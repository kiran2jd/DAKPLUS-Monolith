package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.dto.TestMetadataDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BulkTestUploadService {

    private final DocumentParsingService documentParsingService;
    private final QuestionExtractionService questionExtractionService;
    private final TestService testService;

    @Async
    public void processBulkUpload(MultipartFile[] files, String topicId, String subtopicId, List<String> courseIds, String userId) {
        System.out.println("Starting bulk upload processing for " + files.length + " files...");
        
        for (MultipartFile file : files) {
            try {
                String filename = file.getOriginalFilename();
                System.out.println("Processing file: " + filename);
                
                // 1. Extract Text
                String text = documentParsingService.extractText(file);
                if (text == null || text.isBlank()) {
                    System.err.println("Empty text extracted from: " + filename);
                    continue;
                }
                
                // 2. Detect Metadata if not provided
                String finalTopicId = topicId;
                String finalSubtopicId = subtopicId;
                List<String> finalCourseIds = courseIds;
                
                if (finalTopicId == null || finalTopicId.isBlank() || finalCourseIds == null || finalCourseIds.isEmpty()) {
                    System.out.println("Detecting metadata for: " + filename + "...");
                    TestMetadataDTO detected = questionExtractionService.detectTestMetadata(text);
                    if (finalTopicId == null || finalTopicId.isBlank()) {
                        finalTopicId = detected.getTopicId();
                        finalSubtopicId = detected.getSubtopicId();
                    }
                    if (finalCourseIds == null || finalCourseIds.isEmpty()) {
                        finalCourseIds = detected.getCourseIds();
                    }
                    System.out.println("AI suggested Topic: " + finalTopicId + ", Courses: " + finalCourseIds);
                }
                
                // 3. Extract Questions (English)
                List<Question> questions = questionExtractionService.extractQuestions(text, finalTopicId, finalSubtopicId);
                if (questions.isEmpty()) {
                    System.err.println("No questions extracted from: " + filename);
                    continue;
                }
                
                // 3. Create Test
                Test test = new Test();
                String title = filename;
                if (title != null) {
                    // Remove extension
                    if (title.contains(".")) {
                        title = title.substring(0, title.lastIndexOf("."));
                    }
                    // Replace underscores/dashes with spaces and capitalize
                    title = title.replace("_", " ").replace("-", " ").trim();
                    if (title.length() > 2) {
                        title = title.substring(0, 1).toUpperCase() + title.substring(1);
                    }
                }
                test.setTitle(title);
                test.setTopicId(finalTopicId);
                test.setSubtopicId(finalSubtopicId);
                test.setCourseIds(finalCourseIds);
                test.setCreatedBy(userId);
                test.setQuestions(questions);
                test.setDurationMinutes(questions.size()); // Default 1 min per question
                
                Test savedTest = testService.createTest(test);
                System.out.println("Created test: " + savedTest.getTitle() + " with " + questions.size() + " questions.");
                
                // 4. Trigger Batch Enrichment (Hindi + Explanations)
                questionExtractionService.enrichQuestionsInBatchesAsync(savedTest.getId(), savedTest.getQuestions());
                
            } catch (Exception e) {
                System.err.println("Error processing bulk file " + file.getOriginalFilename() + ": " + e.getMessage());
            }
        }
        
        System.out.println("Bulk upload processing complete.");
    }
}
